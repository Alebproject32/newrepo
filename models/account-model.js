const pool = require("../database/")
const bcrypt = require("bcryptjs")

/* *****************************
* Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(account_password, 10)
    
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    ])
    
    console.log("Account registered successfully:", result.rows[0])
    return result.rows[0]
    
  } catch (error) {
    console.error("Error in registerAccount model:", error.message)
    return null
  }
}

/* *****************************
 * Check if email exists
 * *************************** */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount > 0
  } catch (error) {
    console.error("Check existing email error:", error)
    return false
  }
}

/* *****************************
 * Get account by email
 * *************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = "SELECT account_id, account_firstname, account_lastname, account_email, account_password, account_type FROM account WHERE account_email = $1"
    const data = await pool.query(sql, [account_email])
    return data.rows[0]
  } catch (error) {
    console.error("Get account by email error:", error)
    return null
  }
}


module.exports = {
  registerAccount,
  checkExistingEmail,  
  getAccountByEmail   
}