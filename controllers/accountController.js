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
      account_email: "", 
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
    
    // if user not found, we should handle this gracefully before trying to compare passwords
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
    
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
    
    // Change: Redirección a la ruta base de la cuenta 
    req.flash("notice", "Login successful! Welcome back.")
    return res.redirect("/account/") 
    
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
    
    // Usamos res.locals.accountData que es inyectada por checkLogin
    const accountData = res.locals.accountData; 

    res.render("account/management", {
      title: "Account Management",
      nav,
      errors: null,
      accountData: accountData // Usamos los datos inyectados
    })
  } catch (error) {
    console.error("Account management error:", error)
    next(error)
  }
}

/* ****************************************
* Deliver update account view
* *************************************** */
async function buildAccountUpdate(req, res, next) {
  try {
    let nav = await utilities.getNav()
    // Los datos de la cuenta se inyectan en res.locals por el middleware checkLogin
    const accountData = res.locals.accountData;
    const account_id = accountData.account_id; 
    
    // Usamos los datos de la sesión para pre-llenar el formulario
    const account_firstname = accountData.account_firstname;
    const account_lastname = accountData.account_lastname;
    const account_email = accountData.account_email;

    res.render("account/update", {
      title: "Update Account Information",
      nav,
      errors: null,
      accountData: accountData, // Datos completos de la cuenta para usar en la vista
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    })
  } catch (error) {
    console.error("Build account update error:", error)
    next(error)
  }
}

/* ****************************************
 * Process Account Information Update
 * *************************************** */
async function updateAccount(req, res) {
    const { account_firstname, account_lastname, account_email, account_id } = req.body;
    let nav = await utilities.getNav();
    // Obtener los datos actuales de la cuenta desde res.locals
    const accountData = res.locals.accountData; 

    // 1. Llamar al modelo para actualizar los datos
    const updateResult = await accountModel.updateAccount(
        account_firstname,
        account_lastname,
        account_email,
        account_id
    );

    if (updateResult) {
        // 2. Éxito: Re-obtener los datos actualizados y actualizar el token JWT de la cookie
        const updatedAccountData = await accountModel.getAccountById(account_id);
        delete updatedAccountData.account_password;

        const accessToken = jwt.sign(
            updatedAccountData,
            process.env.ACCESS_TOKEN_SECRET || 'fallback_secret_for_development',
            { expiresIn: 3600 * 1000 }
        );
        
        const cookieOptions = {
            httpOnly: true,
            maxAge: 3600 * 1000
        }
        if (process.env.NODE_ENV !== 'development') {
            cookieOptions.secure = true 
        }

        res.cookie("jwt", accessToken, cookieOptions);

        req.flash("notice", "Account information updated successfully.");
        return res.redirect("/account/");
    } else {
        // 3. Falla: Renderizar la vista de actualización con mensaje de error
        req.flash("notice", "Update failed. Please try again.");
        
        return res.status(501).render("account/update", {
            title: "Update Account Information",
            nav,
            errors: null, // Si falló después de la validación, errors es null.
            accountData, // Datos originales de la cuenta
            account_id,
            // Re-pasar los datos introducidos por el usuario para pre-llenar el formulario
            account_firstname,
            account_lastname,
            account_email,
        });
    }
}

/* ****************************************
 * Process Password Change (REVISADO: Borra el JWT por seguridad)
 * *************************************** */
async function updatePassword(req, res) {
    const { account_password, account_id } = req.body;
    let nav = await utilities.getNav();
    const accountData = res.locals.accountData; 

    try {
        // 1. Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(account_password, 10);

        // 2. Llamar al modelo para actualizar la contraseña
        const updateResult = await accountModel.updatePassword(
            hashedPassword,
            account_id
        );

        if (updateResult) {
            // Éxito: Borrar el JWT y forzar el re-login por seguridad.
            res.clearCookie("jwt");
            
            req.flash("notice", "Password updated successfully. For security reasons, please log in again with your new password.");
            
            // Redirigir a la vista de login
            return res.redirect("/account/login");
        } else {
            // 3. Falla: Renderizar la vista de actualización con mensaje de error
            req.flash("notice", "Password update failed. Please try again.");
            return res.status(501).render("account/update", {
                title: "Update Account Information",
                nav,
                errors: null, 
                accountData,
                account_id,
            });
        }
    } catch (error) {
        console.error("Password update error in controller:", error);
        req.flash("notice", "An unexpected error occurred during password update.");
        return res.status(500).render("account/update", {
            title: "Update Account Information",
            nav,
            errors: null,
            accountData,
            account_id,
        });
    }
}


/* ****************************************
 * Function: accountLogout
 * Description: Clears the JWT cookie and redirects the user to the home page.
 *************************************** */
async function accountLogout(req, res) {
    try {
        // Clear the JWT cookie 
        res.clearCookie("jwt"); 

        req.flash("notice", "You have been successfully logged out.");

        res.redirect("/");

    } catch (error) {
        console.error("Logout failed:", error);
        res.redirect("/");
    }
}


// EXPORTS: 
module.exports = { 
  buildLogin, 
  buildRegistration, 
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildAccountUpdate, 
  updateAccount, 
  updatePassword, // El nombre de la función ahora coincide con el que ya tenías
  accountLogout 
}