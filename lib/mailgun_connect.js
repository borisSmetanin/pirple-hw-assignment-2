/**
 * Container for mailgun connect
 */

 let mailgun = {};

 module.exports = mailgun;

  /**
  * Load dependencies
  */

 let 
    https  = require('https'),
    config = require('../setting/config'),
    querystring = require('querystring'),
    helpers = require('./helpers');

/**
 * 
 * @param {object}   email_data 
 * Must have the following fields keys
 * - to
 * - subject
 * - html
 * - text  
 * @param {function} callback 
 * Will call back the following:
 * - @param {boolean} err
 * - @param {object} response_payload
 * -- @param {integer} http_code 
 * -- @param {object} 
 */
mailgun.send_message = (email_data, callback) => {

    // For debug - this is how a valid request should
    // let email_data = { 
    //     'to': 'boris.smetanin1703@gmail.com',
    //     'subject': 'Hello Boris', 
    //     'html': '<h1>Tank you, your pizza is ready</h1>',
    //     'text': 'Tank you, your pizza is ready'
    // }
    let 
        mailgun_config          = config.mailgun
        // Add the mandatory from to the request
        complete_message_data   = Object.assign(email_data,  { from: mailgun_config.from}),
        // Data needs to be stringify - since it is passed as "Form Data" to the mailgun API
        string_email_data       = querystring.stringify(email_data),
        // Configure the request options - using the mailgun config
        mailgun_request_options = {
            protocol:mailgun_config.protocol,
            hostname: mailgun_config.api_base_ur,
            method: mailgun_config.send_message.method,
            path: mailgun_config.send_message.url,
            auth: `api:${mailgun_config.private_key}`,
            // Need to indicate that we are passing form data
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(string_email_data)
            }
        },
        // Configure the request
        mailgun_send_email_request = https.request(mailgun_request_options, (mailgun_response) => {
            // Set UTF8 encode on the response from mailgun API
            mailgun_response.setEncoding('utf8');
            // Handel mailgun response
            mailgun_response.on('data', (mailgun_response_body) => {

                // Once all response string is finished - callback the results
                callback(mailgun_response.statusCode!== 200, {
                    http_code: mailgun_response.statusCode,
                    mailgun_response: helpers.paresJsonToObject(mailgun_response_body)
                });
            });
        });

    // Handel internal errors
    mailgun_send_email_request.on('error', (error) => {
       callback(true, {
            http_code: 500,
            mailgun_response: error 
       });
    });

    // Set the request body
    mailgun_send_email_request.write(string_email_data);
    // Send the request
    mailgun_send_email_request.end();
}