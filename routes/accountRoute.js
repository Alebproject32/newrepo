const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// MODIFICATION 1: The old route for login at "/" is removed, 
// and the account management logic is moved here.
// This is the route that requires the utilities.checkLogin middleware 
// to access the management view.
router.get("/", 
  utilities.checkLogin, // <<-- REQUIREMENT: Login verification middleware added
  utilities.handleErrors(accountController.buildAccountManagement)
)

// MODIFICATION 2: A new route "/login" is created for the login view.
// It is important that the buildLogin function is available for redirects.
router.get("/login", utilities.handleErrors(accountController.buildLogin))


// Route to build registration view
router.get("/registration", utilities.handleErrors(accountController.buildRegistration))

// Route to process registration
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Process the login request, I modified "/login" 
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// MODIFICATION 3: The following routes I removed because they were redundant:
// router.get("/", utilities.handleErrors(accountController.buildAccountManagement))
// router.get("/management", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement))

module.exports = router