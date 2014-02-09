var http = require('http');
var journey = require('journey');
var mongojs = require('mongojs');

var databaseUrl = 'plateonic';
var collections = ["meals"];

var db = mongojs(databaseUrl, collections);


var router = new(journey.Router);

var EXPIRATION_MILLISECONDS = 18000000;


/*
* ====================================================
* POST /new
* Create a new meal for a user. Send back matched users
*/
router.post('/new').bind(newMeal);

function newMeal(request, response, data) {
	if(!validateNew(data)) {
		sendFail(response);
		return;
	}

	sendMatchedMeals(response, data);
	data.creation_time = new Date().getTime();
	db.meals.update({ user_id: data.user_id }, data, { upsert: true });
}

/*
* ====================================================
* POST /update
* Get all meals that match with a given user's current
* meal
*/
router.post('/update').bind(getMatchedMeals)

function getMatchedMeals(request, response, data) {
	if(!validateFields(data, ['user_id'])) {
		sendFail(response);
		return;
	}

	db.meals.findOne({ user_id: data.user_id }, function(err, meal) {
		if(err || !meal) {
			sendFail(response);
		}
		else {
			sendMatchedMeals(response, meal);
		}
	});
}

function sendMatchedMeals(response, data) {
	var matches = matchMeals(data);

	matches.limit(10).toArray(function(err,arr) {
		if(err) {
			sendFail(response);
		}
		else {
			sendSuccess(response, { matches: arr });
		}
	});
}

function matchMeals(data) {
	return db.meals.find(
	{
		user_id: { $ne: data.user_id },
		restaurant_id: data.restaurant_id,
		creation_time: { $gt: expiredIfOlderThan() }
	});
}

function expiredIfOlderThan() {
	return (new Date().getTime() - EXPIRATION_MILLISECONDS);
}

/*
* ====================================================
*/
function sendFail(response) {
	response.send(200, {}, { status: "failed" });
}

function sendSuccess(response, data) {
	data.status = "success";
	response.send(200, {}, data);
}

/*
* ====================================================
*/

function validateFields(data, fields) {
	for (i = 0; i < fields.length; i++){
		if ( !(fields[i] in data) ) {
			return false;
		}
	}
	return true;
}

function validateNew(data) {
	return validateFields(data, ['user_id', 'restaurant_id', 'phone_number']);
}

/*
* ====================================================
*/
require('http').createServer(function (request, response) {
	var body = "";

	request.addListener('data', function (chunk) { body += chunk });
	request.addListener('end', function () {
        //
        // Dispatch the request to the router
        //
        router.handle(request, body, function (result) {
        	response.writeHead(result.status, result.headers);
        	response.end(result.body);
        });
    });
}).listen(8080);

console.log('starting');

// curl -X POST -H "Content-Type: application/json" -d '{"user_id":0,"restaurant_id": 1,"phone_number": 1}' http://localhost:8080/new
