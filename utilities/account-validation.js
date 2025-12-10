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

    // Get validation errors
    const errors = validationResult(req)
    console.log("✅ Validation errors:", errors.array()) // DEBUG

    if (!errors.isEmpty()) {
        console.log("❌ Validation failed, rendering registration view") // DEBUG

        let nav = await utilities.getNav()
        const { account_firstname, account_lastname, account_email } = req.body

        // 'return' is used to ensure execution flow stops here
        return res.render("account/registration", {
            title: "Registration",
            nav,
            errors, // Pass the complete errors object
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

        // 'return' is used to ensure execution flow stops here
        return res.render("account/login", {
            title: "Login",
            nav,
            errors, // Pass the complete errors object
            account_email,
        })
    }
    next()
}

/* ****************************************
 * New: Validation rules for Account Information Update
 * *************************************** */
regValidate.accountUpdateRules = () => {
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

        // Email validation (must not exist if changed)
        body("account_email")
            .trim()
            .notEmpty()
            .withMessage("Email is required.")
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required.")
            .custom(async (account_email, { req }) => {
                // FIX: We cannot use res.locals here. We use account_id from req.body 
                // to fetch the original email from the database for comparison.
                const accountId = req.body.account_id;
                let originalAccountData = { account_email: "" };

                if (accountId) {
                    // Fetch the original account data using the ID (source of truth)
                    originalAccountData = await accountModel.getAccountById(accountId) || {};
                }
                
                const currentEmail = originalAccountData.account_email; 

                // Only check for existence if the email has actually changed
                if (account_email !== currentEmail) {
                    const emailExists = await accountModel.checkExistingEmail(account_email)
                    if (emailExists) {
                        throw new Error("This email already exists. Please use a different email address.")
                    }
                }
            }),
    ]
}

/* ****************************************
 * New: Check data and return errors or continue to account update
 * *************************************** */
regValidate.checkAccountUpdateData = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        // Extract user input that failed validation
        const { account_firstname, account_lastname, account_email } = req.body

        // Get account data from res.locals (set by checkLogin) to ensure we have the ID for rendering
        // NOTE: res is defined here, so res.locals is safe.
        const accountData = res.locals.accountData || {};

        return res.render("account/update", {
            title: "Account Update",
            nav,
            errors,
            accountData, // Complete account data object (Guaranteed to be defined!)
            // Resubmit user input to pre-fill the form fields that passed validation but were submitted
            account_firstname,
            account_lastname,
            account_email,
        })
    }
    next()
}

/* ****************************************
 * New: Validation rules for Password Change
 * *************************************** */
regValidate.passwordChangeRules = () => {
    return [
        // Password validation (must meet requirements)
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
 * New: Check data and return errors or continue to password change
 * *************************************** */
regValidate.checkPasswordChangeData = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()

        // Get account data from res.locals (set by checkLogin) to ensure we have the ID for rendering
        const accountData = res.locals.accountData || {};

        // Flash message for better user experience on failure
        req.flash("notice", "Password change failed. Please review the password requirements.")

        return res.render("account/update", {
            title: "Account Update",
            nav,
            errors,
            accountData, // Complete account data object (Guaranteed to be defined!)
            // Re-passing original data for form consistency
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
        })
    }
    next()
}

module.exports = regValidate