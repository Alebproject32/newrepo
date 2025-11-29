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

// Route to management view
router.get("/", invController.buildManagement);

// Route to add classification view
router.get("/add-classification", invController.buildAddClassification);

// Route to process adding classification
router.post("/add-classification", invController.addClassification);

// Route to add inventory view
router.get("/add-inventory", invController.buildAddInventory);

// Route to process adding inventory
router.post("/add-inventory", invController.addInventory);

module.exports = router;