# Node.js Pizza API (Pirple Homework assignment 2)

This is a simple pizza delivery API in which you can make simple HTTP request in order to interact with Node.js based web App i made as part of my online Node.js course.

You may register as a user to the pizza delivery, login, see the menu, create an order, monitor the order status, logout and even delete yourself from the pizza delivery service.

This API is using [Stripe](https://stripe.com/) as the payment service and [Mailgun](https://www.mailgun.com/) as the email service (you will get an email after you make successful order)

## Installation (on Linux based machines)
1. Install Node.js 
2. Fork this repository to your local machine
3. you will need to create local directory called ```data``` which will contain the App's data - This app has no DB and it is writing directly to the file system of your machine so make sure you have read and write permission to your directory
4. In ```data``` directory creat the following sub-directories: ```orders```, ```tokens``` and ```users```
5. create another directory called ```settings``` in the root of the app.
6. take the provided  ```config-example.js``` file (already located in the root of the app) and place it inside the ```settings``` directory you created earlier, change the file name to be ```config.js```.
7. in the ```config.js``` file you will need to configure your credentials for ```mailgun``` and ```stripe``` API's. replace whatever is in ```<PASSWORD>``` with your real credentials
8. In the command line, run the following command from the root directory of this app:

```bash
node index.js
```
9. you should be able to see the following:

```bash
http is on
https is on
```

## How to use the API

The API is a RESTfull API, so you will need some sort of HTTP client in order to communicate with it like [Postman](https://www.getpostman.com/).

All actions in the API require you to first have a user and then retrieve a token. 

Once a token is retrieved, you will need to sent it the request header like so:

``` cURL
'Authorization: 41589041575c6f0c9202fb9849659add'
```

All API actions will need to have your email as well. 

Some will expect it be be as part of the url request (in case you want to edit your own details or when you want to delete yourself from the system). 

Others will require you to provide it as part of the request payload (JSON in case of a POST/PUT HTTP request and query params in case of GET request).

Base URL is ```http://localhost:3000```

If your request is valid - you will get a ```200 OK HTTP``` code back and a response payload.

If your request is not valid - you will get one of the following HTTP codes:

1. ```412``` - "Pre-condition failed" - Regular validation error (missing field, invalid type etc..)
2. ```403``` - "Permission denied"    - Probably if you have a password mismatch or your token was expired
3. ```500``` - "Internal server error" - Something went wrong inside the App itself

All API responses consist of the following format:

```javascript
{  
   "code":200, // or an error status
   "error":false, // or true in case there is an error
   "payload":{  
      "message":"Summery of your request status",
      "data":{  
           // Will contain the main part of the information like the order details -
           // - or like the reason you didn't pass validations
      }
   }
}
```

### Create a user: ```POST /users``` - This is the first step you will need to take
```javascript
{
	"email": "your_email@test.com", 
	"name": "John doe", 
	"city":"London", 
	"street_name":"Downing", 
	"street_number":"10", 
	"password": "12345678"
}
```
### Login: ```POST /tokens``` - login to the API by creating an access token (which will be expired after 1 hour)

``` javascript
{
	"email": "your_email@test.com",
	"password": "12345678"
}

```
### Pizza Menu: ```GET /menu?email=<your_email>``` - To see the possible menu options you can make order from
``` javascript
{
	"email": "your_email@test.com",
	"password": "12345678"
}

```

### Make an order: ```POST /orders``` - Once order is complete you should get an email. You would want to check in with the order status at this point
``` javascript
{
	"email": "your_email@test.com",
        // the key is the order item name, value is the amount you with to have for each item
	"order": {
		"margarita": 2,
		"coca_cola": 3,
		"pepperoni": 5,
		"sprite": 1
	},
	"credit_card": "12345678"
}

```

### View all orders: ```GET /orders?email=<email>```

### View a specific order: ```GET /order/<order_id>?email=<email>```

### Update your personal data: ```PUT /users/<email>```

``` javascript
{
	"name": "Luck Skywalker", 
	"city":"Tatooine City", 
	"street_name":"Java The Hutt boulevard", 
	"street_number":"2000", 
}
```

### Logout ```DELETE /tokens/<token>```

### Remove yourself from been a user of the pizza delivery: ```DELETE /users/<email>```