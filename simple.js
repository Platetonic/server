var http = require('http');
var journey = require('journey');

var router = new(journey.Router);
router.post('/dist').bind(dist);

function dist(request, response, data) {
	response.send({ dist:distanceBetween(data, {latitude:1.5,latitude:1.5}) });
}

function distanceBetween(l1, l2) {
	var EARTH_RADIUS = 3963.1906;
	var dLat = (l1.latitude - l2.latitude).toRad();
	var dLon = (l1.longitude - l2.longitude).toRad();
	var lat1 = l1.latitude.toRad();
	var lat2 = l2.latitude.toRad();

	var a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.sin(dLon/2) * Math.sin(dLon/2)) * (Math.cos(lat1) * Math.cos(lat2)); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return EARTH_RADIUS * c;
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
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
