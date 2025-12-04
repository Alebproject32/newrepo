// ******************************************
// * This server.js file is the primary file of the 
// * application. It is used to control the project.
// *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const flash = require("connect-flash")
const env = require("dotenv").config()
const pool = require('./database/')
const Util = require("./utilities/")
const cookieParser = require("cookie-parser")
const path = require('path') // <<< AÑADIDO: Importación de path

// Create Express application
const app = express()

/* ***********************
 * Middleware Requires
 *************************/
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const accountRoute = require("./routes/accountRoute")

/* ***************************************
 * View Engine and Templates
 *****************************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")
app.set("views", path.join(__dirname, 'views')) // <<< AÑADIDO: Configura el directorio raíz de vistas

/* ***************************************
 * Middleware for static files
 *****************************************/
app.use(express.static("public"))

/* ***************************************
 * Body Parsing Middleware
 *****************************************/
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ***********************
 * Session Middleware
 *************************/
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
app.use(cookieParser())

/* *********************************
 * Flash Message Middleware
 *********************************/
app.use(flash())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

/* ***********************
 * JWT Token Middleware
 *************************/
app.use(Util.checkJWTToken)


/* ***********************
 * Routes
 *************************/

// Static Routes
app.use(staticRoutes)

// Index Route
app.get("/", baseController.buildHome)

// Inventory Routes
app.use("/inv", inventoryRoute)

// Account Routes
app.use("/account", accountRoute)

// Route to intentionally trigger a 500 error (for testing)
app.get("/error", baseController.trigger500Error)

/* ***********************
 * 404 Error Handler
 * Must be the last route in the list
 *************************/
app.use(async (req, res, next) => {
  next({
    status: 404, 
    message: 'Sorry, the page you are looking for could not be found.'
  })
})

/* ***********************
 * Express Error Handler
 * Place after all other middleware and routes
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await Util.getNav()
  
  // Log the error for debugging
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  console.error(err.stack) // Full error stack for debugging
  
  // Determine status code and user-friendly message
  const status = err.status || 500
  let message = err.message
  
  // For 500 errors, show generic message to users
  if (status === 500) {
    message = 'Oh no! There was a server error. Please try again later or contact support.'
  }

  // Render error page
  res.status(status).render("./errors/error", {
    title: `Error ${status}`,
    message: message,
    nav,
    layout: false, // Disable layout for error pages
  })
})

/* ***********************
 * Server Configuration
 *************************/
const port = process.env.PORT || 3000
const host = process.env.HOST || '0.0.0.0'

/* ***********************
 * Start Server
 *************************/
app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app