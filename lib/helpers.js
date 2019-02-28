/**
 * Helpers container
 */

let helpers = {};

helpers.paresJsonToObject = (json_string) => {

    try {
        return JSON.parse(json_string);
    } catch(e) {

        return {};
    }
}

helpers.extract = (object, keys) => {
    return keys
        .map(key => key in object ? {[key]: object[key]} : {})
        .reduce((res, o) => Object.assign(res, o), {})
}


module.exports = helpers;