var express = require('express'),
    http = require('http'),
    Cloudant = require('cloudant');

var app = express();

app.use(express.static(__dirname + '/public'));

//display homepage
app.get('/', function(req, res){
    console.log( 'app.get(/)' );

    res.sendFile(__dirname + '/public/index.html');
});

//===============Data Cache=============
var players = [];

//===============CLOUDANT===============
var user = "thomagr";
var password = "EJS-13grt";

// service requests for redonly access to the database
app.get('/players', function(req, res) {
    console.log('app.get(/players)');

    if(players.length){
        res.send(players);
        return console.log('Sending player cache');
    }

    Cloudant({
        account: user,
        password: password
    }, function (er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }
        var db = cloudant.use("players");
        db.list({include_docs: true}, function (err, body) {
            if (err)
                return console.log('Error list: %s', err.message);

            // convert docs to an array of players and store in cache
            var data = body.rows;

            for (var i=0; i < data.length; i++){

                players.push({
                    name: data[i].doc.last_name + ', ' + data[i].doc.first_name,
                    mobile: data[i].doc.mobile,
                    home: data[i].doc.home,
                    email: data[i].doc.email
                });
            }

            players.sort(function(a,b){
                return a.name.localeCompare(b.name)
            });

            res.send(players);
        });
    });
});

var port = process.env.PORT || 8000;
app.listen(port);
console.log("listening on " + port + "!");
