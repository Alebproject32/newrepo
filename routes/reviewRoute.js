// Rutas para manejar las reseñas (Reviews)
const express = require("express")
const router = new express.Router()
const reviewController = require("../controllers/reviewController") // 1. Importar el controlador
const Util = require("../utilities/") 
const reviewValidate = require("../utilities/review-validator") // 2. Importar la validación

// Ruta POST para añadir una nueva reseña
// La ruta espera que el cuerpo de la solicitud contenga: 
// review_text, inv_id, y account_id
router.post(
    "/add-review", 
    Util.checkLogin, // Middleware para asegurar que el usuario esté logueado
    reviewValidate.reviewRules(), // Middleware para validar los datos de la reseña
    Util.handleErrors(reviewController.addReview) // Llama al controlador para procesar la reseña
)

// Exporta el router para que pueda ser usado en server.js
module.exports = router