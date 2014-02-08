var http = require('http');
var journey = require('journey');
var mongojs = require('mongojs');

var databaseUrl = 'plateonic';
var collections = ["meals"];

var db = mongojs(databaseUrl, collections);


var router = new(journey.Router);
router.post('/new').bind(newMeal);



var MAX_MATCH_DISTANCE = 3


function newMeal(request, response, data) {
	sendMatchedUsers(response, data);
	data.creation_time = new Date().getTime();
	db.meals.update({ user_id: data.user_id }, data, { upsert: true });
}

function sendMatchedUsers(response, data) {
	var matched = db.meals.find({user_id: { $ne: data.user_id }, restaurant_id: data.restaurant_id});
	matched.limit(10).toArray(function(err,arr) { response.send(200, {}, {matched:arr}) });
}

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

// Use curl -X POST -H "Content-Type: application/json" -d '{"user_id":"ok","food_preference":"no","location":{"longitude":31,"latitude":23}}' http://localhost:8080/store
