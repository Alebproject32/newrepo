const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

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
            // FIX: Changed 'classificationList' back to 'classificationSelect' to match the EJS view
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
    try {
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

        // Call the model function to perform the update
        const updateResult = await invModel.updateInventory(
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
            classification_id
        )

        if (updateResult) {
            const itemName = updateResult.inv_make + " " + updateResult.inv_model
            req.flash("notice", `The ${itemName} was successfully updated.`)
            // Redirect to the management view on success
            res.redirect("/inv/")
        } else {
            // Rebuild the classification list with the attempted classification selected
            const classificationSelect = await utilities.buildClassificationList(classification_id) // Renamed variable locally
            const itemName = `${inv_make} ${inv_model}`
            req.flash("notice", "Sorry, the update failed.")
            
            // Render the edit view on failure (status 501 - Not Implemented/Server Error)
            res.status(501).render("./inventory/update-inventory", {
                title: "Edit " + itemName,
                nav,
                // FIX: Use 'classificationSelect' to match the EJS view
                classificationSelect: classificationSelect, 
                errors: null, // Errors were handled by the middleware, but passing null for consistency
                inv_id,
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
            })
        }
    } catch (error) {
        console.error("Update inventory error:", error)
        next(error)
    }
}

module.exports = invCont