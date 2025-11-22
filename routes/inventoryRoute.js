// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")

// Route to build inventory by classification view
// URL Example: /inv/type/Sport
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route for Vehicle specifications.
// URL Example: /inv/detail/10
router.get("/detail/:invId", invController.buildByInvId);

module.exports = router;