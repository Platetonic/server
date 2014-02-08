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
	sendNearbyUsers(response, data);
	db.meals.update({ user_id: data.user_id }, data, { upsert: true });
}

function sendNearbyUsers(response, data) {
	var nearby = db.meals.find({food_preference:data.food_preference, location:data.location});
	nearby.limit(10).toArray(function(err,arr) { response.send(200, {}, {nearby:arr}) });
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}
}

function distanceBetween(l1, l2) {
	var EARTH_RADIUS = 3963.1906;
	var dLat = (l1.latitude - l2.latitude).toRad();
	var dLon = (l1.longitude - l2.longitude).toRad();
	var lat1 = l1.latitude.toRad();
	var lat2 = l2.latitude.toRad();

	var a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return EARTH_RADIUS * c;
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
