/**
 * Container for the users controller object
 */
let users = {};

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

users.get = (request, callback) => {

    /**
     * GET /users/<email> 
     */
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

users.get_collection = (payload, callback) => {

    callback(
        200, 
        false,
        {
            msg: 'get_collection'
        } 
    );
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

users.put = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'put' }
    );
}

users.delete = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'delete' }
    );
}

users.post_test = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'post_test' }
    );;
}