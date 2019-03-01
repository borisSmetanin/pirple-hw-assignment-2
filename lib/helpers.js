/**
 * Helpers container
 */
var helpers = {};

module.exports = helpers;
/**
 * Load Dependencies
 */

 let 
    crypto     = require('crypto'),
    file_model = require('./file_model');
/**
 * parse json string to object - catches the error in case the string is not valid
 * 
 * @param   {JSON} json_string 
 * @returns {object}
 */
helpers.paresJsonToObject = (json_string) => {

    try {
        return JSON.parse(json_string);
    } catch(e) {

        return {};
    }
}
/**
 * Extracts existing keys from an object
 *  
 * @param {*} object 
 * @param {*} keys 
 */
helpers.extract = (object, keys) => {
    return keys
        .map(key => key in object ? {[key]: object[key]} : {})
        .reduce((res, o) => Object.assign(res, o), {})
}


/**
 * Create the user id
 * 
 * **This best be a functions as well since in the future we might want to change the id creation rules**
 * @param   {string} email 
 * @returns {string} user id (md5 string)
 */
helpers.create_user_id = (email) => {
    return crypto.createHash('md5').update(email).digest('hex');
}

/**
 * @param {string} password
 * 
 * @returns {string} hashed password string 
 */
helpers.hash_password = (password) => {

    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Validation helper for string field
 * 
 * @param {string} string_field_value 
 * @param {string} string_field_name 
 * @param {integer} max_chars_allowed 
 * 
 * @returns {string | boolean} - returns the string validation error or false if no error was found
 */
helpers.string_field_validation = (string_field_value, string_field_name, max_chars_allowed) => {
    if ( ! string_field_value) {
        return `${string_field_name} must not be empty`;
    }

    if (typeof string_field_value !== 'string') {
        return `${string_field_name} must be string, "${typeof string_field_value}" was given.`;
    }
    
    if (string_field_value.length > max_chars_allowed) {
        return `${string_field_name} is too long. This field is restricted to ${max_chars_allowed} characters.`;
    }

    return false;
}


/**
 * Verifies correct token was given
 * 
 * @param {string}   token 
 * @param {string}   user_email 
 * @param {function} callback 
 */
helpers.verify_token = (token, user_email, callback) => {
    // Get the token
    file_model.read('tokens', token, (err, token_data) => {
        if ( ! err) {
            // Compare the token to the given email
            if (token_data.user_id === helpers.create_user_id(user_email)) {

                // Check that token was not expired
                if (Date.now() < token_data.expired) {
                    callback(false);
                } else {
                    callback(true, 'Token is expired');
                }
            } else {
                callback(true, 'Token does not match the users id');
            }
        } else {
            callback(true, 'Token does not exist');
        }
    });
}