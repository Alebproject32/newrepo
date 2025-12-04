const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// Route to build login view
router.get("/", utilities.handleErrors(accountController.buildLogin))

// New Route to build management view
router.get("/", utilities.handleErrors(accountController.buildAccountManagement)) // --> "New route"

// Route to build registration view
router.get("/registration", utilities.handleErrors(accountController.buildRegistration))

// Route to process registration
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Process the login request
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// NEW: Route for account management view
router.get("/management", utilities.handleErrors(accountController.buildAccountManagement))

module.exports = router