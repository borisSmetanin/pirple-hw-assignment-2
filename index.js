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

