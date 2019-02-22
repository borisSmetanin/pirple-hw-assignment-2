/**
 * Container for the users controller object
 */
let users = {};

//'get_collection', 'get', 'post_collection', 'put', 'delete'
users.get = (payload, callback) => {

    callback(
        200, 
        false,
        {
            msg: 'get'
        }
    );
}

users.get_collection = (payload, callback) => {

    callback(
        200, 
        false,
        {
            msg: 'get_collection'
        } 
    );
}

users.post_collection = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'post_collection' }
    );
}

users.put = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'put' }
    );
}

users.delete = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'delete' }
    );
}

users.post_test = (payload, callback) => {

    callback(
        200, 
        false,
        { msg: 'post_test' }
    );;
}

module.exports = users;