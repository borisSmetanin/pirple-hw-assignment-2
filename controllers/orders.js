/**
 * Container for orders controller
 */

 let orders = {};

 // Export the orders
 module.exports = orders;

 // Load dependencies

 let 
    helpers         = require('../lib/helpers'),
    file_model      = require('../lib/file_model'),
    menu_items      = require('../assets/menu_items'),
    stripe_connect  = require('../lib/stripe_connect'),
    mailgun_connect = require('../lib/mailgun_connect');



 /**
  * TODO need to write documentation in here..
  */
 orders.post_collection = (request, callback) => {


    if (request.payload.email) {

        
        if (request.payload.credit_card && typeof request.payload.credit_card === 'string') {

            helpers.verify_token(request.token, request.payload.email, (err, token_data) => {
        
                if ( ! err) {
                    orders.validate_order(request.payload.order, (err) => {
    
                        if ( ! err) {
    
                            let 
                                user_id    = token_data.user_id,
                                request_time = Date.now(),
                                order_name = `${user_id}_${request_time}`,
                                order_data = {
                                    id: order_name,
                                    time: request_time,
                                    order: request.payload.order,
                                    menu: helpers.extract(menu_items, Object.keys(request.payload.order)),
                                    order_complete: false,
                                    email_sent: false,
                                    payment_complete: false,
                                    payment_sum: 0,
                                    errors: [],
                                    payment_data: {}
                                },
                                payment_sum = 0
    
                            // calculate price:
                            for (order_item in order_data.order) {
                                payment_sum += (order_data.menu[order_item].price * order_data.order[order_item]);
                            }

                            // Create a payment request to stripe
                            orders.create_payment(request.payload.credit_card, payment_sum, (err, payment_data) => {
                                
                                // Add payment data to the order
                                order_data.payment_data     = payment_data;
                                order_data.order_complete   = true;
                                order_data.payment_complete = true;
                                // Add sum to the order (to be stored in the DB)
                                order_data.payment_sum    = payment_sum;
                                if ( ! err) {
                                    
                                    // Create the order
                                    file_model.create('orders', order_name, order_data, (err) => {
            
                                        if ( ! err) {
                                            // Call back the end user about the process been done
                                            callback(200, false,  {
                                                message: `You'r pizza order was successfully created, confirmation email will be sent to you in a few moments`,
                                                order: order_data
                                            });

                                            //===  start async actions =====
                                            orders.send_email_receipt(user_id, order_data, payment_data.stripe_response.receipt_url , (err) => {

                                                if ( ! err) {
        
                                                    orders.update_order(order_name, { email_sent: true, order_complete: true }, (err) => {
        
                                                        if ( ! err) {
                                                            console.log('payment completed, email sent and order was updated!');
                                                        } else {
                                                            console.log('could not update email sent: ', err);  
                                                        }
                                                    });
                                                } else {
                                                    console.log('could not send email: ', err); 
                                                }
                                            });

                                        } else {
                                            callback(500, true,  {
                                                message: `Could not crate the order, something went wrong`
                                            });
                                        }
                                    });

                                } else {
                                    callback(500, true,  {
                                        message: `Problem with your payment`,
                                        payments_data: payment_data
                                    });
                                }
                            });

                        } else {
                            callback(412, true,  {
                                message: `Invalid order: ${err}`
                            }); 
                        }
                    });
                    
                } else {
                    callback(403, true,  {
                        message: `Invalid or expired token was provided`
                    });
                }
            });
        } else {
            callback(412, true,  {
                message: `Pleas provide a valid credit card`
            });
        }

    } else {
        callback(412, true,  {
            message: `Email is missing from the request`
        });
    }
 }

 orders.get = (request, callback) => {

    helpers.verify_token(request.token, request.query_object.email, (err, token_data) => {

        if ( ! err) {

            file_model.read('orders', request.id, (err, order_data) => {

                if ( ! err) {
                    callback(200, false,  {
                        message: null,
                        order: order_data
                    });
                } else {
                    callback(404, true,  {
                        message: `Could not find your order`
                    }); 
                }
            });
        } else {
            callback(403, true,  {
                message: `Invalid or expired token was provided`
            });
        }
    });
 }

 /**
  * GET /orders
  */
 orders.get_collection = (request, callback) => {

    helpers.verify_token(request.token, request.query_object.email, (err, token_data) => {
        if ( ! err) {

            file_model.read_collection('orders', token_data.user_id, (err, orders) => {

                if ( ! err) {

                    callback(200, false,  {
                        message: `Orders were retrieved successfully`,
                        orders: orders
                    });
                } else { 
                    callback(500, true,  {
                        message: `Internal err, pleas try again later`
                    });
                }                
            });

        } else {
            callback(403, true,  {
                message: `Invalid or expired token was provided`
            });
        }
    });

 }

 orders.validate_order = (requested_order, callback) => {

    if (requested_order) {

        let requested_order_type = typeof requested_order;
        
        if (requested_order_type === 'object') {

            if ( ! Array.isArray(requested_order)) {

                let valid_menu_item_names = Object.keys(menu_items);
                if (valid_menu_item_names.length >= Object.keys(requested_order).length) {
    
                    let err_msg = null;
                    for (order_item in requested_order) {
            
                        if (valid_menu_item_names.indexOf(order_item) < 0) {
                            err_msg = `Invalid order item was given: ${order_item}. valid order items are: ${valid_menu_item_names.join(', ')}`
                            break;
                        }
    
                        if ( ! Number.isInteger(requested_order[order_item])) {
                            err_msg = `Order item value must be a valid integer, "${typeof requested_order[order_item]}" was given`
                            break;
                        }

                        if ( requested_order[order_item] <= 0) {
                            err_msg = `"${menu_items[order_item].title}" amount must be higher then 0.`
                            break;
                        }
    
                        if ( requested_order[order_item] >= 10) {
                            err_msg = `Can't order more then 10 "${menu_items[order_item].title}" in a single order.`
                            break;
                        }
                    }
    
                    if ( ! err_msg) {
                        callback(false);
                    } else {
                        callback(err_msg);
                    }
    
    
                } else {
                    callback(`Order contains more items then that are in the menu`);
                }
            } else {
                callback(`Order must be an object of menu items and their amount`);
            }

        } else {
            callback(`Order must be an object. "${requested_order_type}" was given`);
        }

    } else {
        callback('Missing order');
    }
 }

 
 /**
  * 
  */
 orders.create_payment = (credit_card, payment_sum, callback) => {

    let payment_data = {
        amount: payment_sum,
        currency: 'usd',
        source: credit_card
    };

    stripe_connect.pay(payment_data, (payment_err, response_payload) => {

        if ( ! payment_err) {
           
            callback(false, response_payload);
        } else {
            callback(true, response_payload);
        }
    });
 }


 orders.update_order = (order_id, update_data, callback) => {
    
    file_model.read('orders', order_id, (err, order_data) => {

        if ( ! err) {

            let updated_order = Object.assign(order_data, update_data);
            // order_data.payment_complete = true;
            file_model.update('orders', order_id, updated_order, (err) => {

                if ( ! err) {
                    callback(false);
                } else {
                    callback(err);  
                }
            });

        } else {
            callback(err); 
        }
    });
 }
 /**
  * Send an email to the user about his payment been accepted
  * 
  * @param id
  * @param order_data
  * @param receipt_url
  * @param callback
  */
 orders.send_email_receipt = (id, order_data, receipt_url, callback) => {

    // Get users data
    file_model.read('users',id, (err, user) => {

        if ( ! err) {

            // Get the HTML email template
            file_model.read_html('html_templates', 'thank_you_email_template', (err, thank_you_email_template) => {

                if ( ! err) {

                    // Prepare the pizza items so they can be displayed nicely in the template
                    let ordered_items = [];
                    Object.keys(order_data.order).forEach( (order_item) => {
                        ordered_items.push(`${order_data.order[order_item]} ${order_data.menu[order_item].title} (${order_data.menu[order_item].price}$ for each)`);
                    });

                    let 
                        // Populate the template with user's data
                        thank_you_email_html = thank_you_email_template
                            .replace('{{name}}', user.name )
                            .replace('{{order_items}}', ordered_items.join(', '))
                            .replace('{{receipt_url}}', receipt_url)
                            .replace('{{total_sum}}', order_data.payment_sum),

                        // Prepare the email's payload
                        email_data = { 
                            to: user.email,
                            subject: `Pizza delivery notification`, 
                            html: thank_you_email_html,
                            text: 'Tank you, your pizza is ready'
                        };

                    // Send the email
                    mailgun_connect.send_message(email_data, (err, email_send_response) => {

                        // Execute the callbacks
                        if ( ! err) {
                            callback(false, email_send_response);
                        } else {
                            callback(err, email_send_response);
                        }
                    });

                   
                } else {
                    callback(err);
                }
            });
        } else {

            callback(err);
        }
    });
 }