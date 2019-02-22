/**
 * Helpers container
 */

let helpers = {};

helpers.paresJsonToObject = function (json_string) {

    try {
        return JSON.parse(json_string);
    } catch(e) {

        return {};
    }
}


module.exports = helpers;