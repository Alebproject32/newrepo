const pool = require("../database/")

/* *****************************
* Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password
    ])
    
    // Si la inserción fue exitosa, retorna los datos del usuario
    console.log("Account registered successfully:", result.rows[0])
    return result.rows[0]
    
  } catch (error) {
    // CORREGIDO: Retorna null en lugar del mensaje de error
    console.error("Error in registerAccount model:", error.message)
    return null
  }
}

module.exports = {
  registerAccount,
}