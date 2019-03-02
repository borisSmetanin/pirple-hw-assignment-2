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

const hour_in_milliseconds = 3600000;

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
                        token_expired = Date.now() + hour_in_milliseconds,
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

 /**
  * PUT /tokens/<token_id>
  * 
  * required
  * @email {string} - must provide email to authenticate token indeed belongs to this user
  */
 tokens.put = (request, callback) => {

    let token_id = request.id;

    // M,kae sure email was provided
    if (request.payload.user_email) {

        // Validate token exist, belongs to thew user and not yet expired
        helpers.verify_token(token_id, request.payload.user_email, (err, token_data) => {

            if ( ! err && token_data) {
                // Update the token
                token_data.expired = Date.now() + hour_in_milliseconds;
                file_model.update('tokens', token_id, token_data, (err) => {
                    if ( ! err) {
                        callback(200, false, {
                            message: 'Token was extended successfully'
                        });
                    } else {
                        callback(500, true, {
                            message: 'Could not update the token'
                        }); 
                    }
                });
            } else {
                callback(403, true, {
                    message: 'Token or user email are invalid. Make sure your token is not already expired'
                });
            }
        });
    } else {
        callback(403, true, {
            message: 'Token or user email are invalid'
        }); 
    }
 }

 /**
  * DELETE /tokens/<token_id>
  */
 tokens.delete = (request, callback) => {

    let token_id = request.id;

    if (request.payload.user_email) {
        
        // Get the token
        file_model.read('tokens', token_id, (err, token_data) => {
    
            if ( ! err && token_data) {
    
                // Check if provided user's email is the same as in the token's data
                if (token_data.user_id === helpers.create_user_id(request.payload.user_email)) {

                    file_model.delete('tokens', token_id, (err) => {

                        if ( ! err) {

                            callback(200, false, {
                                message: 'Token was deleted successfully'
                            })
                        } else {
                            callback(500, true, {
                                message: 'Could not delete the token'
                            });
                        }
                    });
                } else {
                    callback(403, true, {
                        message: 'Token or user email is invalid'
                    });
                }
            } else {
                callback(404, true, {
                    message: 'Token not found'
                });
            }
        });
    } else {
        callback(403, true, {
            message: 'Token or user email is invalid'
        }); 
    }
 }