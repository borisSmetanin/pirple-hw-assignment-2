/**
 *  ==== Technical notes =====
 * 1. file system helper
 * - create a file
 * - update a file
 * 
 * 2. users service 
 * * create new user - POST /user 
 * ** fields - email (will be the key), name, city, street name, number, password. id will be md5 of the email
 * ** need to make sure user does not exists before creating new one (try to load the given user's email)
 * ** after creating the user - Create an order file with users is as the key - this will be a big JSON with all of its orders
 * ** when user is created - the user orders JSON file is created as well as an empty JSON file
 * 
 * 
 * 3. token service 
 * - Create new token -  POST /token
 * ** fields - email, id, expires (now + 1 hour)
 * ** before creating user must provide email + password to check user exists
 * ** token id must be random unique string - unique for each token !!
 * ** token i valid for 1 hour
 * 
 * - extend existing token PUT /token/<id>
 * - must provide email + password - this will add make token expired 1 hour from now
 * 
 * - logout - destroys a token DELETE /token/<id> 
 * ** this will physically delete a token 
 * 
 * 4. login validation logic - special inner helper that will be provided with a token id + callback
 * - needed for each action expect for POST /user 
 *   GET /menu - NEEDS TO BE CHECKED AS WELL - according to the spec
 * - user must provide token id
 * - check if token exists
 * - check if token not expired
 * 
 * 
 * 5. continue users service
 * 
 * - show users data - GET user/<id>
 * 
 * - update users PUT /user/<id>
 * ** update all but the email
 * 
 * - delete the user - DELETE /user/<id>
 * **  this will physically delete a user
 * - 
 * 
 * 7. get the possible menu: 
 * - GET /menu - array of possible menu items: name, id, price, description
 * 
 * 8. orders service
 * - create new order - POST /order 
 * ** fields: 
 * *** timestamp - will be the key
 * *** item ids - must be real item ids  from the menu 
 * *** user_id - from the user's data 
 * *** payment_confirmed - false at first (maybe its a code?), 
 * *** email_sent   - false at first
 * *** 
 * ** make the payment to strip - get some sort of payment id / confirmation data
 * ** credit card will not be saved - simply passed to Strip API
 * 
 * ** save confirmation data in the order object
 * ** once confirmation data is saved - send an email about it to the client
 * ** save will be made if - one of the steps had failed (email/payment)
 * ** 
 * ** orders will be saved in the users order json, 
 * ** this JSON will always be appended with a new data
 * 
 * - Show specific order - GET /order/<id>
 * - Show all orders     - GET /order
 *  
 */


/**
 * Load dependencies
 */

let server = require('./lib/server');


/**
 * Container for the app
 */
let app = {};

app.init = () => {
    // Initialize the server
    server.serve();
}

// Start the application
app.init();