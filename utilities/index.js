const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {}

/* ***********************
 * Middleware to handle errors in asynchronous routes
 * ***********************
 * This function wraps any asynchronous controller function.
 * If the wrapped function throws an error, next(error) is automatically called.
 * *********************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    let data = await invModel.getClassifications()
    
    // Inicia la lista con el enlace "Home"
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'

    console.log("DEBUG - Home link generated:", list.substring(0, 50))

    // *****************************************************************
    // CRITICAL FIX: Add check for data and rows before attempting iteration
    // Esto previene el error 500 si la base de datos está vacía o si falla la consulta.
    // *****************************************************************
    if (data && data.rows && data.rows.length > 0) {
      data.rows.forEach((row) => {
        list += "<li>"
        list +=
          '<a href="/inv/type/' +
          row.classification_id +
          '" title="See our inventory of ' +
          row.classification_name +
          ' vehicles">' +
          row.classification_name +
          "</a>"
        list += "</li>"
      })
    }

    list += "</ul>"
    
    console.log("DEBUG - Final nav HTML length:", list.length)
    console.log("DEBUG - First 200 chars:", list.substring(0, 200))
    
    return list
  } catch (error) {
    console.error("Error in getNav:", error)
    // Retornar navegación básica en caso de error
    return '<ul><li><a href="/" title="Home page">Home</a></li></ul>'
  }
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=   '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>' // Corregí la asignación de 'grid' que faltaba
  }
  return grid
}

/* **************************************
 * Build the single vehicle detail view HTML
 * ************************************ */
Util.buildDetailsHTML = async function(vehicle) {
    let detailHTML = '<div id="vehicle-detail-view">';
    
    // Main content.
    detailHTML += '<div class="vehicle-details-container">'; 

    // size image.
    detailHTML += `<img src="${vehicle.inv_image}" alt="${vehicle.inv_make} ${vehicle.inv_model} image" class="detail-image">`;

    // Container of information
    detailHTML += '<div class="detail-info">'; 
    
    // Prominent Information
    detailHTML += `<h2>${vehicle.inv_make} ${vehicle.inv_model} Details</h2>`;
    
    // The Price.
    detailHTML += `<p class="price-detail">Price: **$${new Intl.NumberFormat('en-US').format(vehicle.inv_price)}**</p>`; 

    detailHTML += '<ul class="detail-list">';
    
    // The year.
    detailHTML += `<li><span class="label">Year:</span> ${vehicle.inv_year}</li>`;

    // (The mileage must display with proper place value commas.)
    const rawMileage = vehicle.inv_miles;
    let formattedMileage;

    if (rawMileage && !isNaN(rawMileage)) {
        
        formattedMileage = new Intl.NumberFormat('en-US').format(rawMileage);
    } else {
        
        formattedMileage = 'N/A';
    }

    detailHTML += `<li><span class="label">Mileage:</span> ${formattedMileage}</li>`;

    // (All descriptive data must also be displayed, and following the image example).
    detailHTML += `<li><span class="label">Description:</span> ${vehicle.inv_description}</li>`;
    
    
    detailHTML += `<li><span class="label">Color:</span> ${vehicle.inv_color}</li>`;
    detailHTML += `<li><span class="label">Number of Owners:</span> ${vehicle.inv_owners}</li>`;
    
    detailHTML += '</ul>';
    detailHTML += '</div>'; 
    detailHTML += '</div>'; 
    detailHTML += '</div>'; 
    
    return detailHTML;
}

/* ***************************
 * Build classification list for forms
 * ************************** */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    let data = await invModel.getClassifications()
    let classificationList = '<select name="classification_id" id="classificationList" required>'
    classificationList += "<option value=''>Choose a Classification</option>"
    
    data.rows.forEach((row) => {
      classificationList += '<option value="' + row.classification_id + '"'
      if (classification_id != null && row.classification_id == classification_id) {
        classificationList += " selected "
      }
      classificationList += ">" + row.classification_name + "</option>"
    })
    
    classificationList += "</select>"
    return classificationList
  } catch (error) {
    console.error("Build classification list error:", error)
    return '<select name="classification_id" id="classificationList" required><option value="">Error loading classifications</option></select>'
  }
}

/* ****************************************
 * Middleware to check token validity
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("notice", "Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        res.locals.accountData = accountData
        res.locals.loggedin = 1
        next()
      })
  } else {
    next()
  }
}

/* ****************************************
 *  Check Login
 * ************************************ */
 Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
 }


module.exports = Util