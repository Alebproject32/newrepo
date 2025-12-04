// NEW! Import the account template to interact with the database
const accountModel = require("../models/account-model") 
const utilities = require("../utilities/")
const jwt = require("jsonwebtoken") 
const bcrypt = require("bcryptjs")  
require("dotenv").config()          

/* ****************************************
 * Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    let nav = await utilities.getNav()
    res.render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email: "", // Asegura que se pasa la variable
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 * Deliver registration view
 * *************************************** */
async function buildRegistration(req, res, next) {
  try {
    let nav = await utilities.getNav()
    res.render("account/registration", {
      title: "Register",
      nav,
      errors: null,
      // Asegurar que estas variables siempre existan para que EJS no falle
      account_firstname: "", 
      account_lastname: "", 
      account_email: "", 
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
* Process Registration
* *************************************** */
async function registerAccount(req, res, next) {
  // 1. Recolectar datos del cuerpo (req.body) antes del try
  const { account_firstname, account_lastname, account_email, account_password } = req.body
  
  try {
    let nav = await utilities.getNav()
    
    // 2. Call the model function to register the user
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    )

    if (regResult) {
      // Success: sets a flash message and redirects to the login view
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      // Renderizar la vista de login y pasar el email para pre-rellenar el formulario
      res.status(201).render("account/login", { 
        title: "Login",
        nav,
        errors: null,
        account_email, // Pasar el email para una mejor UX
      })
    } else {
      // Falla de registro en el modelo (regResult es falso)
      req.flash("notice", "Sorry, the registration failed. Please try again.")
      res.status(501).render("account/registration", {
        title: "Registration",
        nav,
        errors: null, 
        // ¡IMPORTANTE! Pasar los datos del cuerpo para rellenar el formulario
        account_firstname,
        account_lastname,
        account_email,
      })
    }
  } catch (error) {
    console.error("Registration error in controller:", error)
    // Manejo de excepciones de servidor (e.g., error de BD o hashing)
    let nav = await utilities.getNav()
    req.flash("notice", "An error occurred during registration. Please try again.")
    res.status(500).render("account/registration", {
      title: "Registration",
      nav,
      errors: null,
      // ¡IMPORTANTE! Pasar los datos del cuerpo en caso de error 500
      account_firstname,
      account_lastname,
      account_email,
    })
  }
}

/* ****************************************
 * Process login request
 * ************************************ */
async function accountLogin(req, res, next) {
  try {
    let nav = await utilities.getNav()
    const { account_email, account_password } = req.body
    
    // search user by email
    const accountData = await accountModel.getAccountByEmail(account_email)
    
    // if user not found
    //if (!accountData) {
    //  req.flash("notice", "Please check your credentials and try again.")
    //  return res.status(400).render("account/login", {
    //    title: "Login",
    //    nav,
    //    errors: null,
    //    account_email,
    //  })
   // }
    
    // confirm password
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password)
    
    if (!passwordMatch) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
    
    // if password is correct, create JWT
    delete accountData.account_password 
    
    const accessToken = jwt.sign(
      accountData, 
      process.env.ACCESS_TOKEN_SECRET || 'fallback_secret_for_development', 
      { expiresIn: 3600 * 1000 } 
    )
    
    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      maxAge: 3600 * 1000
    }
    
    if (process.env.NODE_ENV !== 'development') {
      cookieOptions.secure = true 
    }
    
    res.cookie("jwt", accessToken, cookieOptions)
    
    // Change: Guidance to management view
    req.flash("notice", "Login successful! Welcome back.")
    return res.redirect("/account/management")
    
  } catch (error) {
    console.error("Login error in controller:", error)
    let nav = await utilities.getNav()
    req.flash("notice", "An error occurred during login. Please try again.")
    res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email: req.body.account_email || '',
    })
  }
}

/* ****************************************
 * Deliver account management view
 * *************************************** */
async function buildAccountManagement(req, res, next) {
  try {
    let nav = await utilities.getNav()
    
    
    const token = req.cookies.jwt
    
    if (!token) {
      
      req.flash("notice", "Please log in to access your account.")
      return res.redirect("/account/login")
    }
    
    // Decoding token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret_for_development')
    
    res.render("account/management", {
      title: "Account Management",
      nav,
      errors: null,
      accountData: decoded
    })
  } catch (error) {
    console.error("Account management error:", error)
    
    // If token expired
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie("jwt") // Limpiar cookie inválida
      req.flash("notice", "Your session has expired. Please log in again.")
      return res.redirect("/account/login")
    }
    
    next(error)
  }
}

// MODIFIED! Ensures the new feature is exported
module.exports = { 
  buildLogin, 
  buildRegistration, 
  registerAccount,
  accountLogin,
  buildAccountManagement 
}