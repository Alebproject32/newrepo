const reviewModel = require("../models/review-model") // Corregido: Importación a reviewModel
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
// Importante: Necesario para verificar los errores de validación del middleware
const { validationResult } = require("express-validator") 

const reviewCont = {}

/* ****************************************
* Process New Review
* POST: /reviews/add-review
* *************************************** */
reviewCont.addReview = async function (req, res, next) {
    // 1. Obtener y verificar resultados de validación (asumiendo que el middleware validate.checkReviewData ya corrió)
    const errors = validationResult(req)
    let nav = await utilities.getNav()
    
    // Extraer datos del formulario
    const { 
        review_text, 
        review_rating, 
        inv_id
    } = req.body

    // OBTENER account_id DE LA SESIÓN/TOKEN (MÁS SEGURO)
    const accountId = res.locals.accountData.account_id 
    const invId = parseInt(inv_id)

    // 2. Verificar si el envío de la reseña tiene errores de validación
    if (!errors.isEmpty()) {
        
        // --- Camino de Error: Reconstruir la vista de detalles con errores y datos 'pegajosos' ---
        
        // 2a. Obtener datos del vehículo
        const vehicleData = await invModel.getInventoryByInvId(invId)
        
        // 2b. Obtener reseñas existentes para el vehículo
        const reviewData = await reviewModel.getReviewsByInventoryId(invId) // Corregido el nombre de la función
        
        // 2c. Reconstruir contenido HTML para la vista
        const reviewHTML = await utilities.buildReviewList(reviewData) 
        const detailHTML = await utilities.buildDetailsHTML(vehicleData)

        const title = `${vehicleData.inv_make} ${vehicleData.inv_model}` 

        // Re-renderizar la vista de detalle con errores y datos pegajosos
        return res.status(400).render("inventory/detail", {
            title: title,
            nav,
            detailHTML, 
            reviewHTML, // Pasar las reseñas existentes
            errors, // Pasar los errores de validación
            review_text, // Datos pegajosos del formulario
            inv_id: invId,
            account_id: accountId, 
            review_rating: review_rating, // Pasar la calificación para 'sticky form'
        })
    }

    // 3. Si no hay errores, intentar añadir la reseña
    try {
        const insertResult = await reviewModel.addReview(
            review_text, 
            review_rating,
            invId, 
            accountId // accountId de res.locals
        )

        // 3a. Obtener la información del vehículo para el mensaje flash
        const vehicleData = await invModel.getInventoryByInvId(invId)
        const itemName = `${vehicleData.inv_make} ${vehicleData.inv_model}`

        if (insertResult) {
            req.flash("notice", `Thank you! A review has been added for ${itemName}.`)
        } else {
            // Falla del modelo (ej. problema de inserción en DB)
            req.flash("notice", "Sorry, the review could not be added. Please try again.")
        }

        // 4. Redirige de vuelta a la página de detalle del vehículo
        res.redirect(`/inv/detail/${invId}`)

    } catch (error) {
        // 5. Captura errores inesperados
        console.error("Add review error:", error)
        req.flash("notice", "An unexpected error occurred while adding the review.")
        next(error) 
    }
}

/* ****************************************
* Deliver Edit Review View
* GET: /reviews/edit/:review_id
* *************************************** */
reviewCont.editReviewView = async function (req, res, next) {
    const reviewId = parseInt(req.params.review_id)
    let nav = await utilities.getNav()
    
    // Corregido: Usar el nombre de función del modelo final
    const reviewData = await reviewModel.getReviewById(reviewId) 
    
    // Si no hay datos de reseña, lanza un error (podría ser un 404 más específico)
    if (!reviewData) {
        req.flash("notice", "Review not found it.")
        return res.redirect("/account/") 
    }
    
    // Seguridad: Se recomienda verificar que el usuario logueado sea el dueño de la reseña
    if (reviewData.account_id !== res.locals.accountData.account_id && res.locals.accountData.account_type !== 'Admin') {
        req.flash("notice", "Access denied: You do not have permission to edit this review.")
        return res.redirect("/account/") 
    }

    // Obtener la información del vehículo para el título
    // Usa los datos que vienen unidos en reviewData para evitar otra consulta, si es posible.
    const itemName = `${reviewData.inv_make} ${reviewData.inv_model}` 

    // Renderizar la vista de edición. Necesitarás una vista EJS llamada "review/edit"
    res.render("review/edit", {
        title: `Editar Reseña: ${itemName}`,
        nav,
        errors: null,
        review_id: reviewId,
        review_text: reviewData.review_text,
        review_rating: reviewData.review_rating,
        review_date: new Date(reviewData.review_date).toLocaleDateString("es-ES", {
            year: 'numeric', month: 'long', day: 'numeric'
        }),
        itemName: itemName // Para mostrar en el encabezado de la vista
    })
}

/* ****************************************
* Process Review Update
* POST: /reviews/update (Usamos POST para actualizar si no se usa method-override)
* *************************************** */
reviewCont.updateReview = async function (req, res, next) {
    // 1. Obtener y verificar resultados de validación
    const errors = validationResult(req)
    let nav = await utilities.getNav()
    
    const { 
        review_text, 
        review_rating, 
        review_id
    } = req.body

    const reviewId = parseInt(review_id)
    
    // 2. Si hay errores, reconstruir la vista de edición con datos pegajosos y errores
    if (!errors.isEmpty()) {
        const reviewData = await reviewModel.getReviewById(reviewId) // Corregido el nombre de la función
        const itemName = `${reviewData.inv_make} ${reviewData.inv_model}`

        return res.status(400).render("review/edit", {
            title: `Editar Reseña: ${itemName}`,
            nav,
            errors,
            review_id: reviewId,
            review_text, // Datos pegajosos
            review_rating, // Datos pegajosos
            review_date: new Date(reviewData.review_date).toLocaleDateString("es-ES", {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            itemName: itemName
        })
    }

    // 3. Intentar actualizar la reseña
    const updateResult = await reviewModel.updateReview(
        reviewId, 
        review_text, 
        review_rating
    )

    // 4. Procesar el resultado de la actualización
    if (updateResult) {
        const reviewData = await reviewModel.getReviewById(reviewId) // Corregido el nombre de la función
        const itemName = `${reviewData.inv_make} ${reviewData.inv_model}`

        req.flash("notice", `¡Éxito! La reseña para ${itemName} fue actualizada.`)
        // Redirigir al dashboard de gestión de la cuenta
        res.redirect("/account/") 
    } else {
        // Falla de actualización (ej. DB no modificó nada)
        const reviewData = await reviewModel.getReviewById(reviewId) // Corregido el nombre de la función
        const itemName = `${reviewData.inv_make} ${reviewData.inv_model}`
        
        req.flash("notice", "Lo siento, la actualización de la reseña falló.")
        
        // Re-renderizar la vista con el error y datos pegajosos
        res.status(500).render("review/edit", {
            title: `Editar Reseña: ${itemName}`,
            nav,
            errors: [{ msg: "Error de servidor al intentar actualizar la reseña." }],
            review_id: reviewId,
            review_text,
            review_rating,
            review_date: new Date(reviewData.review_date).toLocaleDateString("es-ES", {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            itemName: itemName
        })
    }
}

/* ****************************************
* Process Review Deletion
* POST: /reviews/delete
* *************************************** */
reviewCont.deleteReview = async function (req, res, next) {
    const { review_id } = req.body
    const reviewId = parseInt(review_id)
    
    // 1. Obtener datos de la reseña y del vehículo para el mensaje
    const reviewData = await reviewModel.getReviewById(reviewId) // Corregido el nombre de la función

    if (!reviewData) {
        req.flash("notice", "Error: Reseña no encontrada para eliminar.")
        return res.redirect("/account/") 
    }

    const itemName = `${reviewData.inv_make} ${reviewData.inv_model}`

    // 2. Intentar eliminar la reseña
    const deleteResult = await reviewModel.deleteReview(reviewId)

    // 3. Procesar el resultado de la eliminación
    if (deleteResult) {
        req.flash("notice", `¡Éxito! La reseña para ${itemName} fue eliminada.`)
        res.redirect("/account/") // Redirigir al dashboard
    } else {
        req.flash("notice", "Lo siento, la eliminación de la reseña falló.")
        res.redirect("/account/") // Redirigir al dashboard, mostrando el error
    }
}


module.exports = reviewCont