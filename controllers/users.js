/**
 * Container for the users controller object
 */
let users = {};

// Export the controller at file start to avoid circular dependencies
module.exports = users;

/**
 * Load dependencies
 */

let 
    file_model = require('../lib/file_model'),
    helpers    = require('../lib/helpers');

// This object contains all possible user fields and the their validation rules
const user_fields_validation_rules = {

    email: (email) => {

        // This validation rule needs to be async since it check if user exists in an async way
        return new Promise((resolve, reject) => {
            let email_type = typeof email;
            if (email_type == 'string') {

               if (email.includes('.') && email.includes('@')) {

                    // Make sure email is trimmed and lower case
                   if (email.trim().toLowerCase().replace(/\s+/g, '') === email) {
                       
                        // File name is lower case email - saved as base64
                       file_model.read('users', helpers.create_user_id(email), (err) => {
                           // When creating new user we are expecting an error
                           if (err) {
                               resolve(false);
                           } else {
                               resolve('This email is taken');
                           }
                       });
                   } else {
                       resolve('Email must not contain any whit-space or upper case letters in it');
                   }
                   
               } else {
                   resolve(`Email is missing "." or "@"`);
               }

            } else {
                resolve(`Wrong email type was given - ${email_type}`)
            }
        });

    },
    name: (name) => {
        return helpers.string_field_validation(name, 'Name', 50);
    },
    city: (city) => {

        return helpers.string_field_validation(city, 'City', 100);
    },

    street_name: (street_name) => {

        return helpers.string_field_validation(street_name, 'Street Name', 100);
    },

    street_number: (street_number) => {

        return helpers.string_field_validation(street_number, 'Street Number', 100);
    },

    password: (password) => {

        let string_validation_error = helpers.string_field_validation(password, 'Password', 50);

        if (string_validation_error) {
            return string_validation_error;
        }
        
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }

        return false;
    }
}

/**
 * Special Async function that loops on the given user payload, validate each field and returns a callback on the very first error it finds
 * 
 * @param {object} user_payload  || user's request payload
 * @param {*} callback           || callback function will set error message of the validation if found, false for no validation errors
 */
users.validate = async (user_payload, callback) => {

    let errors_found = false;
    for (let user_field of Object.keys(user_payload)) {

        // Will wait for each function to finish before moving to the next one
        // This way i can use async functions in an "sync" way while the event loop is free to take other calls
        let validation_error = await user_fields_validation_rules[user_field](user_payload[user_field]);

        // Error was found - set the validation error and stop the loop
        if ( ! errors_found && validation_error) {
            errors_found = validation_error;
            break;
        }
    }

    callback(errors_found);
}

/**
 * GET /users/<email> 
 */
users.get = (request, callback) => {

    let user_email = request.id;
    if ( user_email) {
        helpers.verify_token(request.token, user_email, (err) => {

            if (! err) {

                file_model.read('users', helpers.create_user_id(user_email), (err, user_data) => {
        
                    if ( ! err && user_data) {
        
                        // Remove the password, ES6 style..
                        ({password, ...user_data} = user_data);
                        callback(200, false,  {
                            message: `User's data was fetched successfully`,
                            data: user_data
                        });
                    } else {
                        callback(404, true,  {
                            message: `User was not found`
                            
                        });
                    }
                });
            } else {
                callback(412, true,  {
                    message: `Invalid or expired token was provided`
                }); 
            }
        });
    } else {
        callback(412, true,  {
            message: 'Need to specify the email in the URI'
            
        }) ;
    }
}

/**
 * POST users
 * 
 * Create a single user
 */
users.post_collection = (request, callback) => {

    // White-list the payload to prevent unwanted fields from been saved in the "DB" (user file..)
    let 
        mandatory_fields         = Object.keys(user_fields_validation_rules),
        user_payload             = helpers.extract(request.payload, mandatory_fields),
        user_payload_fields      = Object.keys(user_payload),
        missing_mandatory_fields = mandatory_fields.filter(
            mandatory_field => ! user_payload_fields.includes(mandatory_field)
        );

    // Make sure all mandatory fields are given
    if ( ! missing_mandatory_fields.length > 0) {

        // Validate each field in the request
        users.validate(user_payload, (err) => {

            if ( ! err) {
                let 
                    purified_email  = user_payload.email.trim().toLowerCase().replace(/\s+/g, ''),
                    user_id         = helpers.create_user_id(purified_email),
                    hashed_password = helpers.hash_password(user_payload.password);

                // Set purified email (just in case since we already have validations check on this)
                user_payload.email = purified_email;
                // Sets hashed password - we dont want to save the real password
                user_payload.password = hashed_password;
                // Set the id for the user
                user_payload.id    = user_id;

                // Create the user
                file_model.create('users', user_id, user_payload, (err, create_payload) => {

                    if ( ! err) {
                        // Remove the password, ES6 style..
                        ({password, ...user_payload} = user_payload);
                        callback( 200, false, { 
                            message: 'User was created successfully',
                            data: user_payload
                        });
                    } else {
                        callback( 500, true, { 
                            message: 'Could not create the user',
                        });
                    }
                });

            } else {
                callback( 412, true,{ 
                    message: `User registration filed with the following error: ${err}` 
                });
            }
        });
    } else {
        // Missing Mandatory fields
        callback( 412, true, { 
            message: `User registration filed, missing the following mandatory fields: ${missing_mandatory_fields.join(', ')}` 
        });
    }
}

/**
 * PUT /users/<user_id>
 * 
 * Updates a single user
 */
users.put = (request, callback) => {

    let user_email = request.id;
    helpers.verify_token(request.token, user_email, (err, token_data) => {

        if ( ! err) {
            // check that user has sent any 
            let 
                allowed_fields           = Object.keys(user_fields_validation_rules),
                fields_blocked_from_edit = [ 'password', 'email' ];

            // Remove email and password from possible update options
            // Email can not be updated since all is dependent on it (all orders and tokens are built on this email)
            // Password can not be updated since all tokens relate to this password
            // @TODO in the future - need to add PUT /users/<email>/change_email and PUT /users/<email>/change_password but this is out of the scope of this assignment
            allowed_fields = allowed_fields.filter(allowed_field => ! fields_blocked_from_edit.includes(allowed_field));
    
            let update_payload = helpers.extract(request.payload, allowed_fields);
            
            if (Object.keys(update_payload).length > 0 ) {

                users.validate(update_payload, (err) => {

                    if ( ! err) {

                        // Get the user's data
                        file_model.read('users', token_data.user_id, (err, user_data) => {
                            if ( ! err) {

                                // Assigns the update to the existing user data 
                                // In this way fields that were not included in the update will not be effected
                                // in addition this way i can preserve the email and password
                                let updated_user = Object.assign(user_data, update_payload);

                                // Update the user
                                file_model.update('users', token_data.user_id, updated_user, (err) => {

                                    // Remove the user's password before passing the data back to the user
                                    ({password, ...updated_user} = updated_user);
                                    if ( ! err) {
                                        callback(200, true, {
                                            message: `user was successfully updated`,
                                            data: {
                                                updated_user: updated_user
                                            }
                                        });

                                    } else {
                                        callback(500, true, {
                                            message: `Could not update the user`
                                        });
                                    }
                                });

                            } else {
                                callback(500, true, {
                                    message: `Could not get the use's data`
                                });
                            }
                        });

                    } else {

                        callback(412, true, {
                            message: `Update users has failed due to the following error: ${err}`
                        });
                    }
                });

            } else {
                callback(412, true, {
                    message: `Invalid fields were provided for this update request, please use the following fields only: ${allowed_fields.join(', ')}`
                });
            }
            
        } else {
            callback(403, true, {
                message: 'Invalid token or email was provided'
            });
        }
    });
}