const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 * Build inventory by classification view
 * The function now uses try...catch to pass errors to the central handler.
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
 * The function now uses try...catch and throws an error if data is missing.
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


module.exports = invCont