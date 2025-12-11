/********************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const flash = require("connect-flash")
// Import the standard package for EJS flash messages (asume que has ejecutado: npm install express-messages)
const expressMessages = require('express-messages') 
// Load environment variables immediately
const env = require("dotenv").config() 
const pool = require('./database/')
const Util = require("./utilities/") // Load utilities object
const cookieParser = require("cookie-parser")
const path = require('path')

// Create Express application
const app = express()

/* ***************************************
 * Session Middleware
 * Must come before any routes that use sessions/flash
 *****************************************/
app.use(session({
    // Configure session storage to use PostgreSQL pool
    store: new (require('connect-pg-simple')(session))({
        createTableIfMissing: true,
        pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'sessionId',
}))
app.use(flash())
app.use(cookieParser())

/* *********************************
 * Flash Message Rendering Middleware
 * FIX: La utilidad customizada (Util.buildFlashMessage) generaba el error
 * "messages is not a function". La reemplazamos con el middleware estándar 
 * de 'express-messages', que provee la función 'messages()' esperada 
 * por las vistas EJS.
 *********************************/
// app.use(Util.buildFlashMessage) // <-- La utilidad customizada fue deshabilitada
app.use((req, res, next) => {
    // Asigna la función de renderizado de 'express-messages' a res.locals.messages
    res.locals.messages = expressMessages(req, res);
    next();
})


/* ***********************
 * JWT Token Middleware
 * This function runs on every request to check for a JWT and set 
 * res.locals.loggedin and res.locals.accountData if valid.
 *************************/
app.use(Util.checkJWTToken)

/* ***********************
 * Middleware for static files
 * Must be after auth middleware to ensure correct pathing
 *************************/
app.use(express.static("public"))

/* ***************************************
 * View Engine and Templates
 *****************************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")
app.set("views", path.join(__dirname, 'views'))

/* ***************************************
 * Body Parsing Middleware
 * Must come before any routes that use POST data
 *****************************************/
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


/* ***********************
 * Middleware Requires & Routes
 *************************/
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const accountRoute = require("./routes/accountRoute")
const reviewRoute = require("./routes/reviewRoute")

// Static Routes (CSS, etc.)
app.use(staticRoutes)

// Index Route
app.get("/", baseController.buildHome)

// Inventory Routes
app.use("/inv", inventoryRoute)

// Account Routes
app.use("/account", accountRoute)

// Review Routes
app.use("/reviews", reviewRoute)

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
    // Get the navigation links for the error page
    let nav = await Util.getNav() 
    
    // Log the error for debugging
    console.error(`Error at: "${req.originalUrl}": ${err.message}`)
    // console.error(err.stack) // Uncomment to see the full stack trace

    // Determine status code and user-friendly message
    const status = err.status || 500
    let message = err.message
    
    if (status === 500) {
        message = 'Oh no! There was a server error. Please try again later or contact support.'
    }

    // Render error page
    res.status(status).render("./errors/error", {
        title: `Error ${status}`,
        message: message,
        nav,
        layout: false, // Disable layout for error pages for better error visibility
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