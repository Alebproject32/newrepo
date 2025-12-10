const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// Route to build the account management view at the base path ("/account/")
// Requires checkLogin middleware to ensure the user is logged in
router.get("/", 
  utilities.checkLogin, // <<-- Login verification middleware added
  utilities.handleErrors(accountController.buildAccountManagement)
)

// Route to build the login view
router.get("/login", utilities.handleErrors(accountController.buildLogin))


// Route to build registration view
router.get("/registration", utilities.handleErrors(accountController.buildRegistration))

// Route to process registration (POST /account/register)
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Route to process the login request (POST /account/login)
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// Route to handle the logout process (GET /account/logout)
// This was the missing route that caused the 404 error.
router.get(
  "/logout", 
  utilities.handleErrors(accountController.accountLogout)
)

module.exports = router