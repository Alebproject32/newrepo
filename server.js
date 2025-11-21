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
const static = require("./routes/static") // comment
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");

/* ***************************************
 * Middleware to static files
*****************************************/
app.use(express.static("public")) // a new path to explore the develop before run in Render

/* ************************** 
* "View Engine and Templates"
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

// Inventory routes
app.use("/inv", inventoryRoute)

// File Not Found Route - must be last route in list
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
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
  let nav = await Util.getNav()
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  res.render("errors/error", {
    title: err.status || 'Server Error',
    message: err.message,
    nav
  })
})

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})

