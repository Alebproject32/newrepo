/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const Util = require("./utilities/")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static") 
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");

/* ***************************************
 * Middleware to static files
 *****************************************/
app.use(express.static("public")) // A new path to explore the develop before run in Render

/* ************************** * "View Engine and Templates"
 ****************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // not at views root

/* ***********************
 * Routes
 *************************/
app.use(static) // comment
// Index route
// app.get("/", function(req, res){
  //res.render("index", {title: "Home"})}) // Last route

app.get("/", baseController.buildHome) // New route

// NEW: Route to intentionally trigger a 500 error
app.get("/error", baseController.trigger500Error)

// Inventory routes
app.use("/inv", inventoryRoute)

// File Not Found Route - must be last route in list
// This handles 404 errors and passes them to the main error handler below
app.use(async (req, res, next) => {
  next({status: 404, message: 'Sorry, You are lost. No, we appear to have lost that page.'})
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || process.env.LOCAL_PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

/* ***********************
* Express Error Handler
* This catches all errors passed via next(error) and those from the 404 route.
* Place after all other middleware and routes.
*************************/
app.use(async (err, req, res, next) => {
  let nav = await Util.getNav()
  
  // Log the error to the console for debugging
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  
  // Determine status and set a user-friendly message
  const status = err.status || 500
  let message = err.message
  
  // If it's a 500 status (internal server error), display a general message to the user
  if (status == 500) {
    message = 'Oh no! There was a crash. Maybe try a different route?'
  }

  res.render("./errors/error", {
    title: `Error ${status}`, // Title includes the status code
    message: message, // Use the user-friendly message
    nav,
    layout: false, // <--- ¡The Key!
  })
})

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})