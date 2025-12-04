const utilities = require("./")
const accountModel = require("../models/account-model")
const { body, validationResult } = require("express-validator")

const regValidate = {}

/* ****************************************
 * Registration validation rules
 * *************************************** */
regValidate.registrationRules = () => {
  return [
    // First name validation
    body("account_firstname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a first name.")
      .isAlpha('en-US', { ignore: ' ' })
      .withMessage("First name must contain only letters."),

    // Last name validation
    body("account_lastname")
      .trim()
      .notEmpty()
      .withMessage("Please provide a last name.")
      .isAlpha('en-US', { ignore: ' ' })
      .withMessage("Last name must contain only letters."),

    // Email validation
    body("account_email")
      .trim()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) {
          throw new Error("Email exists. Please log in or use different email")
        }
      }),

    // Password validation
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required.")
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password must be at least 12 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character."),
  ]
}

/* ****************************************
 * Check registration validation results
 * *************************************** */
regValidate.checkRegData = async (req, res, next) => {
  console.log("✅ checkRegData called") // DEBUG
  
  // Obtener errores de validación
  const errors = validationResult(req)
  console.log("✅ Validation errors:", errors.array()) // DEBUG
  
  if (!errors.isEmpty()) {
    console.log("❌ Validation failed, rendering registration view") // DEBUG
    
    let nav = await utilities.getNav()
    const { account_firstname, account_lastname, account_email } = req.body
    
    // Se usa 'return' para asegurar que el control de la ejecución se detiene aquí
    return res.render("account/registration", {
      title: "Registration",
      nav,
      errors, // Pasar el objeto errors completo
      account_firstname,
      account_lastname,
      account_email,
    })
  }
  
  console.log("✅ Validation passed, moving to next middleware") // DEBUG
  next()
}

/* ****************************************
 * Login validation rules
 * *************************************** */
regValidate.loginRules = () => {
  return [
    // Email validation for login
    body("account_email")
      .trim()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    // Password validation for login
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ]
}

/* ****************************************
 * Check login validation results
 * *************************************** */
regValidate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const { account_email } = req.body
    
    // Se usa 'return' para asegurar que el control de la ejecución se detiene aquí
    return res.render("account/login", {
      title: "Login",
      nav,
      errors, // Pasar el objeto errors completo
      account_email,
    })
  }
  next()
}

module.exports = regValidate