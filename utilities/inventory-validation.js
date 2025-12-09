// File: utilities/inventory-validation.js
const { body, validationResult } = require("express-validator")
const utilities = require(".")
const invModel = require("../models/inventory-model")

// Utility function to handle validation errors
const validate = {}

/* **********************************
 * Middleware to Validate Classification
 * ********************************* */
validate.classificationRules = () => {
  return [
    // classification_name is required and must be a string
    body("classification_name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a classification name.") 
      .custom(async (classification_name) => {
        // Ensure the name starts with a letter
        if (!/^[a-zA-Z]/.test(classification_name)) {
          throw new Error("Name must start with a letter and cannot contain spaces or special characters.")
        }
      })
      .custom(async (classification_name) => {
        // Ensure it contains no spaces or special characters (except hyphens)
        if (!/^[a-zA-Z0-9-]*$/.test(classification_name)) {
          throw new Error("Classification name cannot contain spaces or special characters.")
        }
      })
      .custom(async (classification_name) => {
        // Check if classification already exists
        const classificationExists = await invModel.checkExistingClassification(classification_name)
        if (classificationExists) {
          throw new Error("Classification already exists. Please choose a different name.")
        }
      }),
  ]
}

/* ******************************
 * Check data and return errors or continue to add classification
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
  const { classification_name } = req.body
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      errors,
      title: "Add New Classification",
      nav,
      classification_name,
    })
    return
  }
  next()
}

/* **********************************
 * Middleware to Validate Inventory (for both Add and Update)
 * NOTE: The original name for this function was 'newInventoryRules' in the instructions, 
 * but since we are re-using the rules for both Add and Update, 
 * we keep the name as 'inventoryRules' for consistency.
 * ********************************* */
validate.inventoryRules = () => {
  return [
    // inv_make is required and must be alphanumeric
    body("inv_make")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Please provide the Make (minimum 3 characters).")
      .isAlphanumeric('en-US', { ignore: ' ' }) 
      .withMessage("Make must only contain alphanumeric characters and spaces."),

    // inv_model is required and must be alphanumeric
    body("inv_model")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Please provide the Model (minimum 3 characters).")
      .isAlphanumeric('en-US', { ignore: ' ' }) 
      .withMessage("Model must only contain alphanumeric characters and spaces."),
      
    // inv_year is required and must be a 4-digit number
    body("inv_year")
      .trim()
      .isLength({ min: 4, max: 4 })
      .withMessage("Please provide a 4-digit year.")
      .isNumeric()
      .withMessage("Year must be a number."),
      
    // inv_description is required
    body("inv_description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Please provide a description (minimum 10 characters)."),
      
    // inv_image and inv_thumbnail are required
    body("inv_image")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Image path is required."),
      
    body("inv_thumbnail")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Thumbnail path is required."),
      
    // inv_price is required and must be a number
    body("inv_price")
      .trim()
      .isNumeric()
      .withMessage("Price must be a valid number."),
      
    // inv_miles is required and must be a whole integer
    body("inv_miles")
      .trim()
      .isInt({ min: 0 })
      .withMessage("Miles must be a valid whole number (no decimals)."),
      
    // inv_color is required
    body("inv_color")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Color is required."),

    // classification_id is required and must be an integer ID
    body("classification_id")
      .trim()
      .isInt()
      .withMessage("Classification is required and must be a valid ID."),
  ]
}

/* ******************************
 * Check data and return errors or continue to add inventory
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
  const { 
    inv_make, 
    inv_model, 
    inv_year, 
    inv_description, 
    inv_image, 
    inv_thumbnail, 
    inv_price, 
    inv_miles, 
    inv_color, 
    classification_id 
  } = req.body

  let classificationList = await utilities.buildClassificationList(classification_id)
  let errors = validationResult(req)

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("inventory/add-inventory", {
      errors,
      title: "Add New Vehicle",
      nav,
      classificationList,
      inv_make, 
      inv_model, 
      inv_year, 
      inv_description, 
      inv_image, 
      inv_thumbnail, 
      inv_price, 
      inv_miles, 
      inv_color, 
      classification_id,
    })
    return
  }
  next()
}

/* ******************************
 * Check update data and return errors or continue to update inventory
 * Errors will be directed back to the edit view.
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  const { 
    inv_id, // Add the inv_id
    inv_make, 
    inv_model, 
    inv_year, 
    inv_description, 
    inv_image, 
    inv_thumbnail, 
    inv_price, 
    inv_miles, 
    inv_color, 
    classification_id 
  } = req.body

  // Use the same validation rules (inventoryRules)
  let errors = validationResult(req) 

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    // Rebuild classification list, passing the selected classification_id to keep it selected
    let classificationList = await utilities.buildClassificationList(classification_id)
    
    // If there are errors, re-render the edit view (inventory/update-inventory) with form data (req.body)
    const itemName = `${inv_make} ${inv_model}` // Matches the title in invController.buildEditInventory
    res.render("inventory/update-inventory", {
      errors,
      title: "Edit " + itemName, // Same title format
      nav,
      classificationList,
      inv_make, 
      inv_model, 
      inv_year, 
      inv_description, 
      inv_image, 
      inv_thumbnail, 
      inv_price, 
      inv_miles, 
      inv_color, 
      classification_id: parseInt(classification_id),
      inv_id: parseInt(inv_id) // Add the inv_id to return to the view
    })
    return
  }
  next()
}

module.exports = validate