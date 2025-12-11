const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController") 
const reviewController = require("../controllers/reviewController") 
const utilities = require("../utilities/") 
const inventoryValidate = require("../utilities/inventory-validation")
const validate = require("../utilities/review-validator") 
// La siguiente línea se ELIMINA/COMENTA para solucionar el error "Cannot find module"
// const auth = require("../middleware/auth") 

// Route to driver errors
router.get("/trigger-error", invController.triggerError)

// Route to build inventory by classification view (PUBLIC)
// URL Example: /inv/type/Sport
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for Vehicle specifications (PUBLIC).
// URL Example: /inv/detail/10
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInvId));

// Route to management view (REQUIRES EMPLOYEE/ADMIN)
router.get(
    "/",
    utilities.checkLogin, // Checks token validity and sets res.locals.loggedin
    utilities.checkAccountType, // Checks if account_type is 'Employee' or 'Admin'
    utilities.handleErrors(invController.buildManagement)
);

// Route to add classification view (REQUIRES EMPLOYEE/ADMIN)
router.get(
    "/add-classification", 
    utilities.checkLogin, 
    utilities.checkAccountType, // Authorization check
    utilities.handleErrors(invController.buildAddClassification)
);

// Route to process adding classification (REQUIRES EMPLOYEE/ADMIN)
router.post(
  "/add-classification",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  inventoryValidate.classificationRules(),
  inventoryValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
);

// Route to add inventory view (REQUIRES EMPLOYEE/ADMIN)
router.get(
    "/add-inventory", 
    utilities.checkLogin, 
    utilities.checkAccountType, // Authorization check
    utilities.handleErrors(invController.buildAddInventory)
);

// Route to process adding inventory (REQUIRES EMPLOYEE/ADMIN)
router.post(
  "/add-inventory",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  inventoryValidate.inventoryRules(), 
  inventoryValidate.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
);

// Route to get inventory in JSON format for a specific classification (PUBLIC/API)
// URL Example: /inv/getInventory/1
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON));

// Route to build the inventory item edit view (REQUIRES EMPLOYEE/ADMIN).
// Captures the inventoryId passed in the URL (localhost:5500/inv/edit/#).
// This route will present a view to allow editing the item.
router.get(
  "/edit/:inventoryId",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  utilities.handleErrors(invController.buildEditInventory)
);

// Route to process inventory update (REQUIRES EMPLOYEE/ADMIN)
router.post(
  "/update/",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  inventoryValidate.inventoryRules(), 
  inventoryValidate.checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
);

// =========================================================
// NEW ROUTES FOR DELETION (REQUIRES EMPLOYEE/ADMIN)
// =========================================================

// Route GET to show confirmation of delete view
// :invId is a URL parameter 
router.get(
  "/delete/:invId",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  utilities.handleErrors(invController.buildDeleteView) 
);

// Route POST to process inventory deletion
router.post(
  "/delete/",
  utilities.checkLogin, 
  utilities.checkAccountType, // Authorization check
  utilities.handleErrors(invController.deleteInventory) 
);

// Route to add review 
router.post(
  "/add-review",
  utilities.checkLogin, // <<-- ¡CORREGIDO! Usando el middleware existente en 'utilities'
  validate.reviewRules(),
  validate.checkReviewData,
  utilities.handleErrors(reviewController.addReview)
)

module.exports = router;