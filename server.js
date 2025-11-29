// ******************************************
// * This server.js file is the primary file of the 
// * application. It is used to control the project.
// *******************************************/
/* ***********************
 * Require Statements
 *************************/
const session = require("express-session")
const pool = require('./database/')
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const Util = require("./utilities/")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static") 
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");

// *************************
// * Middleware Requires
// *************************
const flash = require("connect-flash") 
const expressMessages = require("express-messages") 
// NEW: Account Route required to handle user login/registration requests
const accountRoute = require("./routes/accountRoute")


/* ***************************************
 * Middleware for static files
 *****************************************/
app.use(express.static("public")) // A new path to explore the develop before run in Render

/* ************************** * View Engine and Templates
 ****************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // Sets the default EJS layout

/* ***********************
 * Session Middleware
 * ************************/
 app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// *********************************
// * Flash Message Middleware (CORRECTED)
// * Uses connect-flash to store messages and express-messages to make 
// * the messages() function available to all views via res.locals.
// *********************************
app.use(flash()) // 1. Initializes connect-flash
app.use(function(req, res, next){
  // 2. Makes the messages() function available to all EJS views via res.locals
  res.locals.messages = expressMessages(req, res)
  next()
})

/* ***********************
 * Routes
 *************************/

// Static Route
app.use(static)

// Index route
app.get("/", baseController.buildHome) 

// Inventory routes
app.use("/inv", inventoryRoute)

// NEW ACCOUNT ROUTE: Connects the account router
// Base path for all account routes will be /account
app.use("/account", accountRoute)

// Route to intentionally trigger a 500 error (placed after main routes)
app.get("/error", baseController.trigger500Error)


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
    layout: false, // Prevents EJS Layout from being used for the error page
  })
})

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})