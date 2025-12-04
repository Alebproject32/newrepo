const Util = require("../utilities/")
const baseController = {}

/* ***************************
 * Build the home view
 * ************************** */
baseController.buildHome = async function(req, res, next){
  const nav = await Util.getNav()
  res.render("index", {title: "Home", nav})
  req.flash("notice", "Please Log in.")
}


/* ***************************
 * Intentional Error Trigger
 * This function forces an unexpected 500 error for testing purposes.
 * ************************** */
baseController.trigger500Error = async function(req, res, next) {
  // We throw an Error object directly. Since it doesn't have a status
  // defined, the Express Error Handler in server.js will assign it status 500.
  throw new Error("This is an intentional 500 server error for testing the global error handler.")
}

module.exports = baseController