/**
 * Container for different app errors
 */
let errors = {};

errors.not_found = (payload, callback) => {
    callback(
        404, 
        'Requested route was not found in this server',
    );
}

module.exports = errors;

 