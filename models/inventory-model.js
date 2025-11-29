const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
  /* // My function to find the error
  try {
    // Intentional error adding "Z" at the last name of table
    const data = await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
    return data.rows;
  } catch (error) {
    console.error("Error in getClassifications:", error);
    throw error; // send the error message again.
  } */
}

module.exports = {getClassifications}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
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
 * Get inventory item by inventory_id
 * ************************** */
async function getInventoryByInvId(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory
      WHERE inv_id = $1`,
      [inv_id]
    )
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

module.exports = {
  getClassifications, 
  getInventoryByClassificationId, 
  getInventoryByInvId,
  addClassification,
  addInventory 
};