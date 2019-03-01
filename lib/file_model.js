/**
 * Container for the file model
 * File model acts like a DB model - it creates, reads, updates and deletes files
 */
let file_model = {}

/**
 * Load dependencies
 */

module.exports = file_model;

let 
    fs      = require('fs'),
    path    = require('path'),
    helpers = require('../lib/helpers');

file_model.collections_path = path.join(__dirname,'/../data/');

/**
 * Create a file
 * 
 * @param {string}   collection
 * @param {string}   file_name
 * @param {object}   data   
 * @param {function} callback
 */
file_model.create = (collection, file_name, data, callback) => {
    fs.open(`${file_model.collections_path}${collection}/${file_name}.json`, 'wx', (err, file_descriptor) => {

        if ( ! err && file_descriptor) {
            fs.writeFile(file_descriptor, JSON.stringify(data), (err) => {

                if ( ! err) {
                    fs.close(file_descriptor, (err) => {
    
                        if ( ! err) {
                            callback( false, { created: true, file_name: `${file_name}.json` });
                        } else {
                            callback('file model - Could not Create a file', { err: err});        
                        }
                    });
                } else {
                    callback('file model - Could not Create a file', { err: err});
                }
            });

        } else {
            callback('file model - Could not Create a file', { err: err});
        }
    });
}

/**
 * Reads a file
 * 
 * @param {string}   collection 
 * @param {string}   file_name 
 * @param {function} callback 
 */
file_model.read = (collection, file_name, callback) => {
    fs.readFile(`${file_model.collections_path}${collection}/${file_name}.json`, 'utf8', (err, data) => {
        if ( ! err && data) {
            callback(false, helpers.paresJsonToObject(data));
        } else{
            callback('Could not read the file', { err: err});
        }
    });
}

/**
 * Update a file
 * 
 * @param {string}  collection 
 * @param {string}  file_name 
 * @param {object}  update_data 
 * @param {function} callback 
 */
file_model.update = (collection, file_name, update_data, callback) => {

    fs.open(`${file_model.collections_path}${collection}/${file_name}.json`, 'r+', (err, file_descriptor) => {

        if ( ! err && file_descriptor) {

            fs.truncate(file_descriptor, (err) => {

                if ( ! err) {

                    fs.writeFile(file_descriptor, JSON.stringify(update_data), (err) => {
                        if ( ! err) {

                            fs.close(file_descriptor, (err) => {

                                if ( ! err) {

                                    callback(false, { updated: true });
                                } else {
                                    callback('Could not update the file',  { err: err});  
                                }
                            });
                        } else{
                            callback('Could not update the file',  { err: err});
                        }
                    });
                } else {

                    callback('Could not update the file',  { err: err});
                }
            });

        } else {
            callback('Could not update the file',  { err: err});
        }
    });
}

/**
 * Delete a file
 * 
 * @param {string}   collection 
 * @param {string}   file_name 
 * @param {function} callback 
 */
file_model.delete = (collection, file_name, callback) => {

    let file_to_delete_path = `${file_model.collections_path}${collection}/${file_name}.json`;

    // Get the data of the file that is going to be deleted so we can pass it to the callback
    fs.readFile(file_to_delete_path, 'utf8', (err, deleted_file_data) => {
        if ( ! err) {
            fs.unlink(file_to_delete_path, (err) => {

                if ( ! err) {
                   callback(false, {
                       deleted: true,
                       deleted_file_data: helpers.paresJsonToObject(deleted_file_data)
                   })
                } else {
            
                    callback('Could not delete a file', {err: err});
                }
            });
            
        } else{
            callback('Could not delete a file', {err: err});
        }
    });
}