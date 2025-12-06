// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities/") // Asegúrate de importar utilities

// Route to build inventory by classification view
// URL Example: /inv/type/Sport
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for Vehicle specifications.
// URL Example: /inv/detail/10
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInvId));

// Route to management view
router.get("/", utilities.handleErrors(invController.buildManagement));

// Route to add classification view
router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification));

// Route to process adding classification
router.post("/add-classification", utilities.handleErrors(invController.addClassification));

// Route to add inventory view
router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory));

// Route to process adding inventory
router.post("/add-inventory", utilities.handleErrors(invController.addInventory));

// Route to get inventory in JSON format for a specific classification
// URL Example: /inv/getInventory/1
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON));

// Ruta para construir la vista de edición de un artículo del inventario.
// Captura el inventoryId pasado en la URL (localhost:5500/inv/edit/#).
// Esta ruta presentará una vista para permitir la edición del ítem.
router.get(
  "/edit/:inventoryId",
  utilities.handleErrors(invController.buildEditInventory)
);

module.exports = router;