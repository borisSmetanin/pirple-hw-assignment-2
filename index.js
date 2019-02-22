// List of TODO's
// Include server file

// Server will know if this is http/https requested will use the right functions for each request with a unified callback

// unified server callback:
// check if controller exists
// check if method exists: (get/post/put/delete + (action name + id) / collection - like we do in kohana)
// if controller not exists or if method does not exist in controller - callback 404 method


/**
 * Load dependencies
 */

let server = require('./lib/server');


/**
 * Container for the app
 */
let app = {};

app.init = () => {
    // Initialize the server
    server.serve();
}

// Start the application
app.init();

