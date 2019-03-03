/**
 * Container for stripe
 */
let stripe = {};

module.exports = stripe;

 /**
  * Load dependencies
  */

 let 
    https  = require('https'),
    config = require('../setting/config'),
    querystring = require('querystring'),
    helpers = require('./helpers');

/**
 * Makes payment request to strip and pass the response to a callback
 * 
 * @param {object}   payment_data see mandatory fields in here: https://stripe.com/docs/api/charges/create?lang=curl
 * @param {function} callback || will call back the following:
 * * http error code {int/bool} (false if it is 200)
 * * stripe response {object} : - http_code, stripe_response
 */
stripe.pay = (payment_data, callback) => {

    // @TODO - sample request for debuging
    // @link - https://stripe.com/docs/api/charges/create?lang=curl
    // let request = {
    //     amount: 2000,
    //     currency: 'usd',
    //     source: 'tok_amex'
    // };
    let 
        // Get the config (this is inside a git ignore file - as all configs with credentials should be)
        stripe_config      = config.stripe,
        // Create the request config object
        stripe_request_config = {
            protocol:stripe_config.protocol,
            hostname: stripe_config.base_url,
            method: stripe_config.actions.charge.method,
            path: stripe_config.actions.charge.url,
            headers: {
                'Authorization': `Bearer ${stripe_config.authentication_key}`
            }
        },
        // Create the request
        stripe_request = https.request(stripe_request_config, (stripe_response) => {

            stripe_response.setEncoding('utf8');
            // Retrieve the data
            stripe_response.on('data', function (stripe_response_body) {

                stripe_response_body = helpers.paresJsonToObject(stripe_response_body);
                if (stripe_response.statusCode == 200 || stripe_response.statusCode == 201) {
                    callback(false, {
                        http_code: stripe_response.statusCode,
                        stripe_response: stripe_response_body
                    });
                } else {
                    callback(true, {
                        http_code: stripe_response.statusCode,
                        stripe_response: stripe_response_body
                    });
                }
            });
        });

        // Catch any internal error
        stripe_request.on('error', function(error){
            callback(true, { 
                http_code: 500, 
                stripe_data: {
                    internal_error: error
                }
            });
        });

        // Send the request
        stripe_request.write(querystring.stringify(payment_data));
        stripe_request.end(); 
}
