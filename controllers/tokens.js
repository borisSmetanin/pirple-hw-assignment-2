/**
 * Container for tokens service
 */
let tokens = {};

// Export the tokens
module.exports = tokens;

/**
 * Load dependencies
 */

let 
    file_model = require('../lib/file_model'),
    helpers    = require('../lib/helpers'),
    crypto     = require('crypto');


//=== Helpers ==========================================================================/

/**
 * Creates the tokens id
 * 
 * @param {integer} token_expired 
 * @param {string}  user_id 
 * @param {string}  user_password 
 */
tokens.create_toke_id = (token_expired, user_id, user_password) => {
    let string_to_hash = `${user_id}_${token_expired}_${user_password}`;
    return crypto.createHash('md5').update(string_to_hash).digest('hex')
}

//=== HTTP methods =====================================================================/
 /**
  * POST /tokens
  * Create new token
  * 
  * Expected payload params:
  * 
  * @param {string} email
  * @param {string} password
  */
 tokens.post_collection = (request, callback) => {

    let token_request_payload = request.payload;

    // Validate correct token payload was given
    if (typeof token_request_payload.email === 'string' && typeof token_request_payload.password === 'string') {

        let user_id = helpers.create_user_id(token_request_payload.email);
        file_model.read('users', user_id, (err, user_data) => {

            if ( ! err) {

                if (user_data.password === helpers.hash_password(token_request_payload.password)) {

                    // Prepare the insert payload
                    let 
                        // Each token is expired after 1 hour
                        token_expired = Date.now() + (1000 * 60 * 60),
                        token_id = tokens.create_toke_id(token_expired, user_id, user_data.password),
                        token_insert_payload = {
                            id: token_id,
                            user_id: user_id,
                            expired: token_expired
                        };

                    file_model.create('tokens', token_id, token_insert_payload, (err) => {

                        if ( ! err) {

                            callback(200, false, {
                                message: 'Token was created successfully',
                                data: { token: token_id }
                            });
                        } else {
                            callback(500, true, {
                                message: 'Tokens - could not create a token, please try again later'
                            });
                        }
                    });
                } else {
                    callback(200, true, {
                        message: 'Invalid email or password'
                    });
                }
            
            } else {
                callback(200, true, {
                    message: 'Invalid email or password'
                });
            }
        })

    } else {
        callback(412, true, {
            message: 'Token - Invalid password or emails were given. Token Expects to have a valid string email and password'
        });
    }
 }