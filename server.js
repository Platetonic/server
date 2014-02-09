var http = require('http');
var journey = require('journey');
var mongojs = require('mongojs');

var databaseUrl = 'plateonic';
var collections = ["meals"];

var db = mongojs(databaseUrl, collections);


var router = new(journey.Router);


/*
* ====================================================
* POST /new
* Create a new meal for a user. Send back matched users
*/
router.post('/new').bind(newMeal);

function newMeal(request, response, data) {
	if(!validateData(data)) {
		sendFail(response);
	}
	else {
		sendMatchedMeals(response, data);
		data.creation_time = new Date().getTime();
		db.meals.update({ user_id: data.user_id }, data, { upsert: true });
	}
}

function validateData(data) {
	return ('user_id' in data) && ('restaurant_id' in data) && ('phone_number' in data);
}

/*
* ====================================================
* POST /update
* Get all meals that match with a given user's current
* meal
*/
router.post('/update').bind(getMatchedMeals)

function getMatchedMeals(request, response, data) {
	var mealData = db.meals.find({ user_id: data.user_id });

	if(!mealData) {
		sendFail(response);
	}
	else {
		sendMatchedMeals(response, mealData);
	}
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
		creation_time: { $lt: new Date().getTime() }
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
