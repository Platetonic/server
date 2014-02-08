var http = require('http');
var journey = require('journey');
var mongojs = require('mongojs');

var router = new(journey.Router);
router.post('/store').bind(store);

var db = mongojs('plateonic',['meals']);

function store(request, response, data) {
	if(data.name == 'ok') {
		db.meals.insert(data);
		response.send(200, {}, {status:'ok'});
	}
	response.send(200, {}, {status:'failed'});
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
