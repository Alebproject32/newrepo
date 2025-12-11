const pool = require("../database/")

/* ***************************
 * Get all classification data
 * ************************** */
async function getClassifications(){
    // Returns the rows so the utility can process the data
    const data = await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
    return data
}

/* ***************************
 * Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
    try {
        const data = await pool.query(
            `SELECT * FROM public.inventory AS i 
            JOIN public.classification AS c 
            ON i.classification_id = c.classification_id 
            WHERE i.classification_id = $1`,
            [classification_id]
        )
        return data.rows
    } catch (error) {
        console.error("getclassificationsbyid error " + error)
    }
}

/* ***************************
 * Get inventory item by inventory_id (Used for details and editing)
 * ************************** */
async function getInventoryByInvId(inv_id) {
    try {
        // Query to get all vehicle details, including inv_miles
        const data = await pool.query(
            `SELECT 
inv_id, inv_make, inv_model, inv_year, inv_description, inv_image, 
inv_thumbnail, inv_price, inv_miles, inv_color, classification_id 
FROM public.inventory
WHERE inv_id = $1`,
            [inv_id]
        )
        // Se elimina el código de depuración (console.log) para el código final
        return data.rows[0] 
    } catch (error) {
        console.error("getInventoryByInvId error " + error)
        throw error 
    }
}

/* ***************************
 * Add new classification
 * ************************** */
async function addClassification(classification_name) {
    try {
        const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
        const result = await pool.query(sql, [classification_name])
        return result.rows[0]
    } catch (error) {
        console.error("Add classification model error:", error)
        return null
    }
}

/* ***************************
 * Add new inventory
 * ************************** */
async function addInventory(
    classification_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color
) {
    try {
        const sql = `INSERT INTO inventory (
            classification_id, inv_make, inv_model, inv_description, 
            inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`
        
        const result = await pool.query(sql, [
            classification_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color
        ])
        
        return result.rows[0]
    } catch (error) {
        console.error("Add inventory model error:", error)
        return null
    }
}

/* ***************************
 * Update Inventory Data
 * ************************** */
async function updateInventory(
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id) {
    try {
        const sql =
            "UPDATE public.inventory SET inv_make = $1, inv_model = $2, inv_description = $3, inv_image = $4, inv_thumbnail = $5, inv_price = $6, inv_year = $7, inv_miles = $8, inv_color = $9, classification_id = $10 WHERE inv_id = $11 RETURNING *"
        const data = await pool.query(sql, [
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classification_id,
            inv_id // $11 for WHERE clause
        ])
        return data.rows[0]
    } catch (error) {
        console.error("model error: " + error)
    }
}

/* ***************************
 * Delete Inventory Item
 * ************************** */
async function deleteInventoryItem(inv_id) {
    try {
        const sql = 'DELETE FROM inventory WHERE inv_id = $1'
        const data = await pool.query(sql, [inv_id])
        // The data object returned from the query includes a rowCount property. 
        // We return the full data object so the controller can check rowCount.
        return data
    } catch (error) {
        // Log the error and throw a new one to be caught by the controller's error handler
        console.error("Delete Inventory Error:", error)
        throw new Error("Delete Inventory Error")
    }
}

/* ***************************
 * Get all reviews for a specific inventory item (inv_id)
 * ************************** */
async function getReviewsByInvId(inv_id) {
    try {
        // Consulta para obtener todas las reseñas, el nombre y el apellido del autor.
        const data = await pool.query(
            `SELECT 
                r.review_text,
                r.review_date,
                a.account_firstname,
                a.account_lastname
            FROM review r
            JOIN account a
            ON r.account_id = a.account_id
            WHERE r.inv_id = $1
            ORDER BY r.review_date DESC`,
            [inv_id]
        )
        return data.rows
    } catch (error) {
        console.error("getReviewsByInvId error: " + error)
        throw error
    }
}

/* ***************************
 * Insert a new review into the database
 * ************************** */
async function insertReview(review_text, inv_id, account_id) {
    try {
        // La columna review_date se establece por defecto a NOW() en la base de datos
        const sql = `INSERT INTO review (
            review_text, 
            inv_id, 
            account_id
        ) VALUES ($1, $2, $3) RETURNING *`

        const result = await pool.query(sql, [
            review_text,
            inv_id,
            account_id
        ])
        
        // Retorna la fila insertada o undefined si falla
        return result.rows[0]
    } catch (error) {
        console.error("insertReview model error:", error)
        // Lanza el error para ser manejado por el controlador
        throw new Error("Database insertion failed for review.")
    }
}


/* ***************************
 * Export functions
 * ************************** */
module.exports = {
    getClassifications, 
    getInventoryByClassificationId, 
    getInventoryByInvId,
    addClassification,
    addInventory,
    updateInventory,
    deleteInventoryItem, 
    getReviewsByInvId,      // <-- Nuevo: Obtener reseñas
    insertReview            // <-- Nuevo: Insertar reseña
};