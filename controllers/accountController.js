// NEW! Import the account template to interact with the database
const accountModel = require("../models/account-model") 
const utilities = require("../utilities/")

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
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 * Process Registration
 * *************************************** */
async function registerAccount(req, res, next) {
  try {
    let nav = await utilities.getNav()
    const { account_firstname, account_lastname, account_email, account_password } = req.body

    // Validación básica
    if (!account_firstname || !account_lastname || !account_email || !account_password) {
      req.flash("notice", "All fields are required.")
      return res.status(400).render("account/registration", {
        title: "Registration",
        nav,
        errors: null, // ← IMPORTANTE
      })
    }

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    )

    if (regResult) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null, // ← FALTABA ESTO - CAUSA ERROR 500
      })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      res.status(501).render("account/registration", {
        title: "Registration",
        nav,
        errors: null, // ← FALTABA ESTO - CAUSA ERROR 500
      })
    }
  } catch (error) {
    console.error("Registration error in controller:", error)
    let nav = await utilities.getNav()
    req.flash("notice", "An error occurred during registration.")
    res.status(500).render("account/registration", {
      title: "Registration",
      nav,
      errors: null, // ← IMPORTANTE
    })
  }
}

// MODIFIED! Ensures the new feature is exported
module.exports = { 
  buildLogin, 
  buildRegistration, 
  registerAccount 
}