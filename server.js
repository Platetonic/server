var http = require('http');
var journey = require('journey');
var mongojs = require('mongojs');

var databaseUrl = 'plateonic';
var collections = ["meals"];

var db = mongojs(databaseUrl, collections);


var router = new(journey.Router);

var EXPIRATION_SECONDS = 18000;


/*
* ====================================================
* POST /new
* Create a new meal for a user. Send back matched users
*/
router.post('/new').bind(newMeal);

function newMeal(request, response, data) {
	if(!validateComplete(data)) {
		sendFail(response);
		return;
	}

	addMealToDB(data);
	getRestaurantMatches(request, response, data);
}

function addMealToDB(meal) {
	meal.createdAt = new Date();
	meal.expireAfterSeconds = EXPIRATION_SECONDS;
	db.meals.update({ user_id: meal.user_id }, meal, { upsert: true });
}

/*
* ====================================================
* POST /view
* View the matches for a certain restaurant given a
* restaurant_id and user_id
*/
router.post('/view').bind(getRestaurantMatches);

function getRestaurantMatches(request, response, data) {
	if(!validateComplete(data)) {
		sendFail(response);
		return;
	}

	sendMatchedMeals(response, data);
}

/*
* ====================================================
* POST /update
* Get all meals that match with a given user's current
* meal
*/
router.post('/update').bind(getUserMatches);

function getUserMatches(request, response, data) {
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
		restaurant_id: data.restaurant_id
	});
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

function validateComplete(data) {
	return validateFields(data, ['user_id', 'restaurant_id']);
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

// curl -X POST -H "Content-Type: application/json" -d '{"user_id":0,"restaurant_id": 1}' http://localhost:8080/new
