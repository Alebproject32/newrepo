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
            grid +=   '<a href="../../inv/detail/'+ vehicle.inv_id
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
        grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

/* **************************************
 * Build the single vehicle detail view HTML
 * Ahora acepta `reviews` para mostrar las reseñas
 * ************************************ */
Util.buildDetailsHTML = async function(vehicle, reviews) {
    let detailHTML = '<div id="vehicle-detail-view">';
    
    // Contenido principal.
    detailHTML += '<div class="vehicle-details-container">';

    // Imagen.
    detailHTML += `<img src="${vehicle.inv_image}" alt="${vehicle.inv_make} ${vehicle.inv_model} image" class="detail-image">`;

    // Contenedor de información
    detailHTML += '<div class="detail-info">';
    
    // Información destacada
    detailHTML += `<h2>${vehicle.inv_make} ${vehicle.inv_model} Details</h2>`;
    
    // El Precio.
    detailHTML += `<p class="price-detail">Price: **$${new Intl.NumberFormat('en-US').format(vehicle.inv_price)}**</p>`;

    detailHTML += '<ul class="detail-list">';
    
    // El año.
    detailHTML += `<li><span class="label">Year:</span> ${vehicle.inv_year}</li>`;

    // Millas (debe mostrarse con comas)
    const rawMileage = vehicle.inv_miles;
    let formattedMileage;

    if (rawMileage && !isNaN(rawMileage)) {
        
        formattedMileage = new Intl.NumberFormat('en-US').format(rawMileage);
    } else {
        
        formattedMileage = 'N/A';
    }

    detailHTML += `<li><span class="label">Mileage:</span> ${formattedMileage}</li>`;

    // Descripción
    detailHTML += `<li><span class="label">Description:</span> ${vehicle.inv_description}</li>`;
    
    
    detailHTML += `<li><span class="label">Color:</span> ${vehicle.inv_color}</li>`;
    // ASUMIMOS que inv_owners ya no está en el objeto vehicle, se remueve.
    // detailHTML += `<li><span class="label">Number of Owners:</span> ${vehicle.inv_owners}</li>`; 
    
    detailHTML += '</ul>';
    detailHTML += '</div>'; // Fin .detail-info
    detailHTML += '</div>'; // Fin .vehicle-details-container
    
    // **********************************************
    // REVIEWS SECTION
    // **********************************************
    detailHTML += '<section id="review-section">';
    detailHTML += `<h2>Customer Reviews for ${vehicle.inv_make} ${vehicle.inv_model}</h2>`;

    // Aquí se genera la lista de reseñas
    detailHTML += Util.buildReviewList(reviews);

    detailHTML += '</section>';
    // **********************************************

    detailHTML += '</div>'; // Fin #vehicle-detail-view
    
    return detailHTML;
}

/* **************************************
 * Build the Reviews List HTML
 * ************************************ */
Util.buildReviewList = function(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p class="notice">Be the first to write a review!</p>';
    }

    let listHTML = '<ul class="review-list">';
    
    reviews.forEach(review => {
        // Formatear la fecha
        const date = new Date(review.review_date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Crear las iniciales del autor: (A. LastName)
        const authorInitials = `${review.account_firstname.charAt(0)}. ${review.account_lastname}`;

        listHTML += '<li>';
        listHTML += `<p class="review-author">**${authorInitials}** wrote on ${formattedDate}:</p>`;
        listHTML += `<p class="review-text">"${review.review_text}"</p>`;
        listHTML += '</li>';
    });

    listHTML += '</ul>';
    return listHTML;
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
 * Middleware to check token validity (Usado globalmente en server.js)
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
 * Check Login (Usado para páginas restringidas)
 ************************************ */
 Util.checkLogin = (req, res, next) => {
    if (res.locals.loggedin) {
        next()
    } else {
        req.flash("notice", "Please log in.")
        return res.redirect("/account/login")
    }
}

/* ****************************************
 * Middleware para verificar el tipo de cuenta para autorización
 * Requisito de la Tarea 2/3: Solo permite acceso a 'Admin' o 'Employee'
 ************************************ */
Util.checkAccountType = (req, res, next) => {
    // Se basa en res.locals.accountData configurado por checkJWTToken
    const accountType = res.locals.accountData ? res.locals.accountData.account_type : null;
    
    // Verifica si el usuario está logueado Y tiene privilegios de 'Admin' o 'Employee'
    if (res.locals.loggedin && (accountType === "Admin" || accountType === "Employee")) {
        next();
    } else {
        req.flash("notice", "You do not have permission to access this page.");
        // Redirige al dashboard de la cuenta o a la página principal
        return res.redirect("/account/"); 
    }
}

/* ***********************
 * Middleware para construir el mensaje Flash y ponerlo en res.locals
 * Esto es necesario para que los mensajes de req.flash() sobrevivan
 * la redirección y se muestren en la plantilla EJS.
 * ************************/
Util.buildFlashMessage = function(req, res, next) {
    // Busca mensajes de éxito ('notice') y error ('error')
    const messages = {
        notice: req.flash('notice'),
        error: req.flash('error')
    };
    
    // Si hay algún mensaje, lo pone en res.locals
    if (messages.notice.length > 0 || messages.error.length > 0) {
        // La vista buscará res.locals.messages.notice o res.locals.messages.error
        res.locals.messages = messages; 
    } else {
        // Asegúrate de que res.locals.messages sea nulo o esté vacío si no hay mensajes
        res.locals.messages = null;
    }
    next();
};


module.exports = Util