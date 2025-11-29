const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")

router.get("/", utilities.handleErrors(accountController.buildLogin))

router.get("/registration", utilities.handleErrors(accountController.buildRegistration))

module.exports = router;