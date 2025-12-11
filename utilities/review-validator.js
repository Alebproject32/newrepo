// Review validation rules file
const { body } = require("express-validator")
// Import validationResult to create a generic check middleware.
const { validationResult } = require("express-validator") 
const utilities = require("../utilities/") // Required to get nav and other resources

const validate = {}

/* **********************************
 * Validation Rules for CREATING a Review
 * Validates: review_text, review_rating, inv_id (account_id is obtained from res.locals)
 * ********************************* */
validate.createReviewRules = () => {
  return [
    // review_text is required and must not be empty
    body("review_text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please write your review before submitting."), 

    // review_rating is required and must be an integer between 1 and 5
    body("review_rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("The rating must be an integer between 1 and 5."),
      
    // inv_id is required and must be a valid integer (associated vehicle)
    body("inv_id")
      .isInt()
      .withMessage("Invalid inventory ID."),
    
    // IMPORTANT: Validation for 'account_id' is removed as it is now securely obtained 
    // from res.locals and NOT from the form body.
  ]
}

/* **********************************
 * ALIAS: reviewRules
 * The route file (inventoryRoute.js) expects a function named reviewRules.
 * We map it to createReviewRules since they perform the same function.
 * ********************************* */
validate.reviewRules = validate.createReviewRules

/* **********************************
 * Validation Rules for UPDATING a Review
 * Validates: review_text, review_rating, review_id
 * ********************************* */
validate.updateReviewRules = () => {
  return [
    // review_text is required and must not be empty
    body("review_text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please write your review."), 

    // review_rating is required and must be an integer between 1 and 5
    body("review_rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("The rating must be an integer between 1 and 5."),
      
    // review_id is required and must be a valid integer (the review to update)
    body("review_id")
      .isInt()
      .withMessage("Invalid review ID."),
  ]
}

/* ****************************************
 * Check Review ID Data (Generic Check Middleware for simple ID verification)
 * *************************************** */
validate.checkIdData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const errorMessages = errors.array().map(err => err.msg).join(", ")
    req.flash("notice", `Validation Error: ${errorMessages}`)
    // Redirect to the account dashboard if validation fails
    return res.redirect("/account/") 
  }
  next()
}

/* ****************************************
 * Check Review Data (Generic Check Middleware for add/update review forms)
 * Redirects back to the inventory detail page on error.
 * *************************************** */
validate.checkReviewData = async (req, res, next) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        return next()
    }
    
    // If validation fails, redirect to the vehicle detail page (inv_id required)
    const invId = req.body.inv_id || req.params.inv_id
    let nav = await utilities.getNav()
    const errorMessages = errors.array().map(err => err.msg).join(", ")
    req.flash("notice", `Review submission failed. ${errorMessages}`)
    
    // NOTE: You must implement logic in your controller to re-render the detail view 
    // or the account management view correctly after this redirection, 
    // but the immediate fix is to redirect away from the failing POST request.
    return res.redirect(`/inv/detail/${invId}`) 
}


module.exports = validate