/**
 * Container for the config
 */

let config = {};

/**
 * Export right away to avoid circular dependencies error
 */
module.exports = config;

config.stripe = {

   protocol: 'https:',
   base_url: 'api.stripe.com',
   authentication_key: '<PUT_REAL_AUTH_KEY_IN_HERE>',
   headers: {
       'Idempotency-Key': '<PUT_REAL_AUTH_KEY_IN_HERE>'
   },
   actions: {
       charge: {
           method: 'POST',
           url: '/v1/charges'
       }
   }
}

config.mailgun = {
    domain: '<PUT_REAL_DOMAIN_IN_HERE>',
    api_base_ur: 'api.mailgun.net',
    from: '<PUT_REAL_FROM_ADDRESS_IN_HERE>',
    private_key: '<PUT_REAL_PRIVATE_KEY_IN_HERE>',
    protocol: 'https:',
    send_message: {
       url: '/v3/<PUT_REAL_KEY_IN_HERE>/messages',
       method:'POST'
    }
}