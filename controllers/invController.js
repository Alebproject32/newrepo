const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
// IMPORTANT: Need this line to handle validation errors from middleware
const { validationResult } = require("express-validator") 

const invCont = {}

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    try {
        const classification_id = req.params.classificationId
        const data = await invModel.getInventoryByClassificationId(classification_id)

        // Check if data was found. If not, throw a 404 error.
        if (!data || data.length === 0) {
            let err = new Error("No vehicles found for this classification.")
            err.status = 404
            throw err
        }
        
        // If data is found, build the grid and render the view
        const grid = await utilities.buildClassificationGrid(data)
        let nav = await utilities.getNav()
        const className = data[0].classification_name
        
        res.render("./inventory/classification", {
            title: className + " vehicles",
            nav,
            grid,
        })
    } catch (error) {
        // Pass the error to the central Express error handler
        next(error)
    }
}

/* ***************************
 * Build inventory item detail view
 * ************************** */
invCont.buildByInvId = async function (req, res, next) {
    try {
        const inv_id = req.params.invId
        const vehicleData = await invModel.getInventoryByInvId(inv_id)

        // Check if vehicle data was found. If not, throw a 404 error.
        if (!vehicleData) {
            // Create and throw a 404 error object
            let err = new Error("Sorry, we could not find that specific vehicle.")
            err.status = 404
            throw err
        }

        // Build HTML for vehicle details
        const detailHTML = await utilities.buildDetailsHTML(vehicleData)

        // Render the detail view
        let nav = await utilities.getNav()
        const title = `${vehicleData.inv_make} ${vehicleData.inv_model}` 

        res.render("./inventory/detail", {
            title: title,
            nav,
            detailHTML, // Variable to use in detail.ejs file
        })
    } catch (error) {
        // Pass the error to the central Express error handler
        next(error)
    }
}

/* ***************************
 * Build management view
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
    try {
        let nav = await utilities.getNav()
        
        // Call utility to build the classification list (select list HTML)
        const classificationList = await utilities.buildClassificationList()

        // Render the view, passing the classification list
        res.render("./inventory/management", {
            title: "Vehicle Management",
            nav,
            errors: null,
            classificationList,
        })
    } catch (error) {
        next(error)
    }
}

/* ***************************
 * Build add classification view
 * ************************** */
invCont.buildAddClassification = async function (req, res, next) {
    try {
        let nav = await utilities.getNav()
        res.render("./inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: null,
        })
    } catch (error) {
        next(error)
    }
}

/* ***************************
 * Add new classification
 * ************************** */
invCont.addClassification = async function (req, res, next) {
    try {
        const { classification_name } = req.body
        let nav = await utilities.getNav()

        // Insert classification
        const result = await invModel.addClassification(classification_name)

        if (result) {
            req.flash("notice", `Classification "${classification_name}" was successfully added.`)
            res.redirect("/inv")
        } else {
            req.flash("notice", "Sorry, adding classification failed.")
            res.status(501).render("./inventory/add-classification", {
                title: "Add New Classification",
                nav,
                errors: null,
            })
        }
    } catch (error) {
        console.error("Add classification error:", error)
        let nav = await utilities.getNav()
        req.flash("notice", "An error occurred while adding classification.")
        res.status(500).render("./inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: null,
        })
    }
}

/* ***************************
 * Build add inventory view
 * ************************** */
invCont.buildAddInventory = async function (req, res, next) {
    try {
        let nav = await utilities.getNav()
        let classificationList = await utilities.buildClassificationList()
        
        res.render("./inventory/add-inventory", {
            title: "Add New Inventory",
            nav,
            classificationList,
            errors: null,
        })
    } catch (error) {
        next(error)
    }
}

/* ***************************
 * Add new inventory
 * ************************** */
invCont.addInventory = async function (req, res, next) {
    try {
        const {
            classification_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color
        } = req.body

        let nav = await utilities.getNav()
        let classificationList = await utilities.buildClassificationList(classification_id)

        // Insert inventory
        const result = await invModel.addInventory(
            classification_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color
        )

        if (result) {
            req.flash("notice", `Vehicle ${inv_make} ${inv_model} was successfully added.`)
            res.redirect("/inv")
        } else {
            req.flash("notice", "Sorry, adding vehicle failed.")
            res.status(501).render("./inventory/add-inventory", {
                title: "Add New Inventory",
                nav,
                classificationList,
                errors: null,
                ...req.body // Pass all form data back for sticky form
            })
        }
    } catch (error) {
        console.error("Add inventory error:", error)
        let nav = await utilities.getNav()
        let classificationList = await utilities.buildClassificationList(req.body.classification_id)
        
        req.flash("notice", "An error occurred while adding vehicle.")
        res.status(500).render("./inventory/add-inventory", {
            title: "Add New Inventory",
            nav,
            classificationList,
            errors: null,
            ...req.body // Pass all form data back for sticky form
        })
    }
}

/* ***************************
 * Return Inventory by Classification As JSON
 * (Key function for AJAX in inventory.js)
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
    const classification_id = parseInt(req.params.classification_id)
    const invData = await invModel.getInventoryByClassificationId(classification_id)
    
    // Return data as JSON or an empty array if no results are found
    if (invData && invData.length > 0) {
        return res.json(invData)
    } else {
        return res.json([]) 
    }
}

/* ***************************
 * Build edit inventory view
 * ************************** */
invCont.buildEditInventory = async function (req, res, next) {
    try {
        // CORRECTION: Use req.params.inventoryId to match the route /edit/:inventoryId
        const inv_id = parseInt(req.params.inventoryId) 
        
        const itemData = await invModel.getInventoryByInvId(inv_id) 

        // Check if itemData was found
        if (!itemData) {
            let err = new Error("Inventory Item not found for editing.")
            err.status = 404
            throw err
        }
        
        let nav = await utilities.getNav()
        
        // Build classification select list, pre-selecting the current classification
        const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
        
        // Create the item name for the title and h1
        const itemName = `${itemData.inv_make} ${itemData.inv_model}`
        
        // Render the view, passing all required data fields
        res.render("./inventory/update-inventory", { 
            title: "Edit " + itemName,
            nav,
            // FIX: Use 'classificationSelect' to match the EJS view
            classificationSelect: classificationSelect, 
            errors: null,
            // Data fields from the itemData object
            inv_id: itemData.inv_id,
            inv_make: itemData.inv_make,
            inv_model: itemData.inv_model,
            inv_year: itemData.inv_year,
            inv_description: itemData.inv_description,
            inv_image: itemData.inv_image,
            inv_thumbnail: itemData.inv_thumbnail,
            inv_price: itemData.inv_price,
            inv_miles: itemData.inv_miles, 
            inv_color: itemData.inv_color,
            classification_id: itemData.classification_id
        })
    } catch (error) {
        // Pass the error to the central Express error handler
        next(error)
    }
}

/* ***************************
 * Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
    // 🚨 CRITICAL DEBUG: Show everything received from the form
    console.log("--- FORM DATA RECEIVED (req.body) ---");
    console.log(req.body);
    console.log("-------------------------------------");

    // 1. Get and check validation results
    let errors = validationResult(req)

    let nav = await utilities.getNav()
    const {
        inv_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color,
        classification_id,
    } = req.body

    // Helper function for robust numeric sanitization: converts '', null, or undefined to null
    // If the database column is NOT NULL, you must ensure the model handles receiving a NULL value 
    // or set a default value like 0 here. For safety, we convert to null if empty.
    const sanitizeNumeric = (value, parser) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        // Ensure that the parsed value is not NaN (if text was entered)
        const parsedValue = parser(value);
        return isNaN(parsedValue) ? null : parsedValue;
    };


    // 🚨 APPLY ROBUST SANITIZATION to ALL numeric fields, including inv_id
    const sanitizedInvId = sanitizeNumeric(inv_id, parseInt);
    const sanitizedClassificationId = sanitizeNumeric(classification_id, parseInt);
    const sanitizedPrice = sanitizeNumeric(inv_price, parseFloat);
    const sanitizedYear = sanitizeNumeric(inv_year, parseInt);
    const sanitizedMiles = sanitizeNumeric(inv_miles, parseInt);
    
    // We must ensure the ID is valid for the update query
    if (sanitizedInvId === null) {
        // If inv_id is null/invalid, the update cannot proceed.
        // This suggests a form error (hidden field missing/empty).
        req.flash("notice", "Error: Vehicle ID is missing for update.")
        return res.redirect("/inv/")
    }


    // 2. If there are validation errors (or if the database model requires NOT NULL)
    if (!errors.isEmpty()) {
        // Re-use the sanitized classification ID for the sticky select list
        const classificationSelect = await utilities.buildClassificationList(sanitizedClassificationId)
        const itemName = `${inv_make} ${inv_model}`
        
        // Re-render the edit view with errors and sticky data
        return res.status(400).render("./inventory/update-inventory", {
            title: "Edit " + itemName,
            nav,
            classificationSelect: classificationSelect, 
            errors: errors, // Pass validation errors
            // Pass the original non-sanitized string values back for the sticky form fields,
            // EXCEPT for the classification_id, which needs the sanitized ID for selection.
            inv_id: inv_id,
            inv_make,
            inv_model,
            inv_year,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_miles,
            inv_color,
            classification_id: sanitizedClassificationId 
        })
    }

    // 3. If no errors, attempt the update
    try {
        // Call the model with the sanitized values
        const updateResult = await invModel.updateInventory(
            sanitizedInvId,  // Use sanitized ID
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            sanitizedPrice, // Use sanitized price
            sanitizedYear,  // Use sanitized year
            sanitizedMiles, // Use sanitized miles
            inv_color,
            sanitizedClassificationId // Use sanitized classification ID
        )

        if (updateResult) {
            const itemName = updateResult.inv_make + " " + updateResult.inv_model
            req.flash("notice", `The ${itemName} was successfully updated.`)
            // Redirect to the management view on success
            res.redirect("/inv/")
        } else {
            // Model failure (DB error not caught by try/catch or no rows updated)
            const classificationSelect = await utilities.buildClassificationList(sanitizedClassificationId)
            const itemName = `${inv_make} ${inv_model}`
            req.flash("notice", "Sorry, the update failed (DB Model Error).")
            
            // Re-render the edit view on model failure
            res.status(501).render("./inventory/update-inventory", {
                title: "Edit " + itemName,
                nav,
                classificationSelect: classificationSelect, 
                errors: null,
                // Pass back the original request body data (which may contain strings)
                inv_id: inv_id, 
                inv_make,
                inv_model,
                inv_year,
                inv_description,
                inv_image,
                inv_thumbnail,
                inv_price,
                inv_miles,
                inv_color,
                classification_id: sanitizedClassificationId
            })
        }
    } catch (error) {
        // Catch unexpected errors (e.g., connection issues)
        console.error("Update inventory error:", error)
        next(error)
    }
}

/* ***************************
 * Build delete confirmation view (RENAMED TO MATCH ROUTE)
 * Step One: Delivers the delete confirmation view with data
 * ************************** */
invCont.buildDeleteView = async function (req, res, next) {
    try {
        // NOTE: The route uses :invId, but your code uses req.params.inventoryId.
        // Assuming your route is '/delete/:invId' and you want to use 'invId' here
        // If the route is '/delete/:invId', you should use req.params.invId
        // We will stick to the route file's convention from the previous response:
        // router.get("/delete/:invId", ...)
        const inv_id = parseInt(req.params.invId)
        
        // Get the data for the inventory item from the database.
        const itemData = await invModel.getInventoryByInvId(inv_id) 

        // Check if itemData was found
        if (!itemData) {
            let err = new Error("Inventory Item not found for deletion.")
            err.status = 404
            throw err
        }
        
        // Build the navigation for the new view.
        let nav = await utilities.getNav()
        
        // Build a name variable to hold the inventory item's make and model.
        const itemName = `${itemData.inv_make} ${itemData.inv_model}`
        
        // Call the res.render function to deliver the delete confirmation view.
        res.render("./inventory/delete-confirm", {
            title: "Delete " + itemName,
            nav,
            errors: null,
            // Add the appropriate data to the data object to populate the form.
            inv_id: itemData.inv_id,
            inv_make: itemData.inv_make,
            inv_model: itemData.inv_model,
            inv_year: itemData.inv_year, 
            inv_price: itemData.inv_price,
            // The following are added to ensure consistency with sticky forms if needed, 
            // though they are not used in the simple delete form:
            inv_description: itemData.inv_description, 
            inv_image: itemData.inv_image,
            inv_thumbnail: itemData.inv_thumbnail,
            inv_miles: itemData.inv_miles, 
            inv_color: itemData.inv_color,
            classification_id: itemData.classification_id
        })
    } catch (error) {
        // Pass the error to the central Express error handler
        console.error("Build delete inventory view error:", error)
        next(error)
    }
}

/* ***************************
 * Process inventory deletion
 * Step Two: Carries out the delete operation
 * ************************** */
invCont.deleteInventory = async function (req, res, next) {
    let nav = await utilities.getNav()
    
    // Collect the inv_id value from the request.body object.
    const { inv_id, inv_make, inv_model } = req.body
    
    // Use parseInt for the inv_id value during the collection and storage.
    const invId = parseInt(inv_id) 

    // Pass the inv_id value to a model-based function to delete the inventory item.
    try {
        // NOTE: Assuming model function is named 'deleteInventoryItem'
        const deleteResult = await invModel.deleteInventoryItem(invId) 

        // If the delete was successful, return a flash message to the inventory management view.
        if (deleteResult) {
            const itemName = `${inv_make} ${inv_model}`
            req.flash("notice", `The ${itemName} was successfully deleted.`)
            res.redirect("/inv/") 
        } else {
            // If the delete failed, return a flash failure message and redirect.
            const itemName = `${inv_make} ${inv_model}`
            req.flash("notice", "Sorry, the deletion failed.")
            
            // Redirect to the route to rebuild the delete view for the same inventory item.
            res.redirect(`/inv/delete/${invId}`) 
        }
    } catch (error) {
        console.error("Delete inventory error:", error)
        // If an unexpected error occurs (e.g., database connection), pass to error handler
        next(error)
    }
}

module.exports = invCont