/**
 * Load Dependencies
 */

 // External modules
 let 
    http          = require('http'),
    https         = require('https'),
    fs            = require('fs'),
    path          = require('path'),
    url           = require('url'),
    StringDecoder = require('string_decoder').StringDecoder;

// External modules

let 
    helpers = require('./helpers');

/**
 * Container for the server
 * 
 */
let server = {};

server.allowed_controllers_and_methods = {
    users: [ 'get_collection', 'get', 'post_collection', 'put', 'delete', `post_test` ]
};

// Create the HTTP server
server.http_server = http.createServer((req, res) => {
    server.router(req, res);
});
 
 
// HTTPS server config
server.https_server_options = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
 
// Create the HTTPS server
server.https_server = https.createServer(server.https_server_options, (req, res) => {
    server.router(req, res);
});

/**
 * Routes the HTTP requests to the different controllers and methods 
 * 
 * In general this API architecture is build to expect following url rout
 * HTTP_METHOD <controller>(/<id>)(/<special_action>) e.g POST/foo/123/check_bar
 * * <controller>     - mandatory - the controller for a specific api entity (like users)
 * * <id>             - optional  - identifier of a specific entity like user's phone for example - in case the action should be made on a specific item inside the controller
 * * <special_action> - optional  - special action that is more then simple CRUD that should be made on a specific item
 */
server.router= (req, res) => {

    // Get the URL from the request and parse it
    let 
        parsed_url   = url.parse(req.url, true),
        pathname     = parsed_url.pathname,
        trimmed_path = pathname.replace(/^\/+|\/+$/g, '');

    if (trimmed_path) {

        let path_arr = trimmed_path.split('/');
        if (path_arr.length <= 3) {

            // Extract the controller
            let 
                controller          = path_arr[0],
                allowed_controllers = Object.keys(server.allowed_controllers_and_methods);
            
                // Validate controller exists
            if (allowed_controllers.indexOf(controller) > -1) {

                // Extract the action
                let
                    http_method     = req.method.toLowerCase(),
                    action          = '',
                    allowed_actions = server.allowed_controllers_and_methods[controller];
                
                // Create the requested action
                switch (path_arr.length) {
                    case 3:
                        action = `${http_method}_${path_arr[2]}`;
                    break;

                    case 2:
                     action = http_method;
                    break;

                    default:
                        action = `${http_method}_collection`;
                    break;
                }

               if (allowed_actions.indexOf(action) >-1) {

                    let 
                        decoder = new StringDecoder,
                        buffer = '';
                    
                    // Get the payload from the request
                    req.on('data', (data) => {
                        buffer+= decoder.write(data);
                    });

                    // Decoder has finished to pass the request payload
                    req.on('end', () => {
                        buffer+= decoder.end();

                        let request = {
                            query_object: parsed_url.query,
                            headers: req.headers,
                            payload: helpers.paresJsonToObject(buffer)
                        };

                        // Execute the correct action
                        server.execute_route(controller, action, request, res); 
                    });
                
               } else {
                    // Action not found
                    server.execute_route('errors', 'not_found', {}, res); 
               } 

            } else {
                // Controller was not found
                server.execute_route('errors', 'not_found', {}, res);
            }

        } else {
            // API support 3 url params, if more then 3 were given - deny that
            server.execute_route('errors', 'not_found', {}, res);
        }
    } else{
        // Deny general request to the domain - in API user must specify exactly where he need to go
        server.execute_route('errors', 'not_found', {}, res);
    }
}

/**
 * Executes a route according the parameters
 */
server.execute_route = (controller_name, method, payload, res) => {

    // Require the controller
    let controller = require(`../controllers/${controller_name}`);

    // Execute the action
    controller[method](payload, (http_code, error, payload) => {

        // Prepare global response
        let response_json = JSON.stringify({
            code: http_code,
            error: error,
            payload: payload || {}
        });

        // Execute the response
        res.statusCode = http_code;
        res.setHeader('Content-Type', 'application/json');
        res.end(response_json);
    });
}

// This will start off the servers
server.serve = () => {

    // Start HTTP server
    server.http_server.listen(3000, () => {
        console.log(`http is on`);
    });

    // Start the HTTPS server
    server.https_server.listen(3001, () => {
        console.log(`https is on`);
    });
}

module.exports = server;