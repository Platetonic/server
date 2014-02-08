var http = require('http');
var journey = require('journey');

var databaseUrl = 'plateonic';
var collections = ["meals"];
var db = require('mongojs');
db.connect(databaseUrl, collections);


var router = new(journey.Router);
router.post('/new').bind(newMeal);

function newMeal(request, response, data) {
	var existingMeals = db.meals.find({user_id:data.user_id}, function (err, found) {
		if (err || !found) {
			console.log('ERROR existing meals find');
		}
	});

	if (existingMeals) {
		db.meals.update({user_id:data.user_id}, {$set:data}, checkDBError);
	}

}

function checkDBError(err, updated) {
	if(err || !updated) {
		console.log('ERROR update');
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
