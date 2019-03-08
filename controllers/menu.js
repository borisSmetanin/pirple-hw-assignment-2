/**
 * Container for the menu controller
 */
let menu = {};

module.exports = menu;

/**
 * Load dependencies
 */
const helpers = require('../lib/helpers');

// Prevent changes in the menu
const menu_items = require('../assets/menu_items');

menu.get_collection = (request, callback) => {

    if (request.query_object.email) {

        helpers.verify_token(request.token, request.query_object.email, (err) => {

            if ( ! err) {
                callback(200, false, {
                    message: `Menu was retrieved successfully`,
                    data: menu_items
                });
            } else {
                callback(403, true, {
                    message: `Invalid token was provided`,
                });
            }
        });

    } else {

        callback(412, true, {
            message: `Email is missing from the request`,
        });
    }
}