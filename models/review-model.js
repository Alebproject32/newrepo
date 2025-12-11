const pool = require("../database/")

/* *****************************
* Get reviews by inventory id
* FROM review table - Joined with account for reviewer's name
* ***************************** */
async function getReviewsByInventoryId(inv_id){
  try {
    const data = await pool.query(
      `SELECT 
        r.review_id, 
        r.review_text, 
        r.review_rating, 
        r.review_date,
        a.account_firstname
      FROM review AS r
      JOIN account AS a ON r.account_id = a.account_id
      WHERE r.inv_id = $1
      ORDER BY r.review_date DESC`,
      [inv_id]
    )
    return data.rows
  } catch (error) {
    console.error("getReviewsByInventoryId error: " + error)
    return error
  }
}

/* *****************************
* Get reviews by account id
* FROM review table - Joined with inventory for vehicle name
* ***************************** */
async function getReviewsByAccountId(account_id){
  try {
    const data = await pool.query(
      `SELECT 
        r.review_id, 
        r.review_text, 
        r.review_rating, 
        r.review_date,
        r.inv_id,
        i.inv_make,
        i.inv_model
      FROM review AS r
      JOIN inventory AS i ON r.inv_id = i.inv_id
      WHERE r.account_id = $1
      ORDER BY r.review_date DESC`,
      [account_id]
    )
    return data.rows
  } catch (error) {
    console.error("getReviewsByAccountId error: " + error)
    return error
  }
}

/* *****************************
* Insert new review
* INTO review table
* ***************************** */
async function addReview(review_text, review_rating, inv_id, account_id){
  try {
    const sql = "INSERT INTO review (review_text, review_rating, inv_id, account_id) VALUES ($1, $2, $3, $4) RETURNING *"
    const result = await pool.query(sql, [review_text, review_rating, inv_id, account_id])
    return result
  } catch (error) {
    console.error("addReview error: " + error.message)
    return error.message
  }
}

/* *****************************
* Update a review
* IN review table - Also updates review_date
* ***************************** */
async function updateReview(review_id, review_text, review_rating){
  try {
    const sql = "UPDATE review SET review_text = $2, review_rating = $3, review_date = NOW() WHERE review_id = $1 RETURNING *"
    const result = await pool.query(sql, [review_id, review_text, review_rating])
    return result.rowCount > 0
  } catch (error) {
    console.error("updateReview error: " + error.message)
    return error.message
  }
}

/* *****************************
* Delete a review
* FROM review table
* ***************************** */
async function deleteReview(review_id) {
  try {
    const sql = 'DELETE FROM review WHERE review_id = $1';
    const deleteResult = await pool.query(sql, [review_id]);
    return deleteResult.rowCount > 0;
  } catch (error) {
    console.error("deleteReview error: " + error);
    return false;
  }
}

/* *****************************
* Get a specific review by review_id - Joined with inventory for vehicle details
* FROM review table
* ***************************** */
async function getReviewById(review_id) {
  try {
    const data = await pool.query(
      `SELECT 
        r.review_id, 
        r.review_text, 
        r.review_rating, 
        r.review_date,
        r.inv_id,
        r.account_id,
        i.inv_make,
        i.inv_model,
        i.inv_year
      FROM review AS r
      JOIN inventory AS i ON r.inv_id = i.inv_id
      WHERE r.review_id = $1`,
      [review_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getReviewById error: " + error)
    return error
  }
}


module.exports = {
  getReviewsByInventoryId,
  getReviewsByAccountId,
  addReview,
  updateReview,
  deleteReview,
  getReviewById
}