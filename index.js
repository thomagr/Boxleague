var express = require('express'),
    http = require('http'),
    bodyParser = require('body-parser'),
    Cloudant = require('cloudant');

var app = express();

// client
app.use(express.static(__dirname + '/public/pages'));
app.use(express.static(__dirname + '/public'));

// client APIs
app.use(express.static(__dirname + '/node_modules/xlsx/dist'));
app.use(express.static(__dirname + '/node_modules/angular-dynamic-layout/dist'));
app.use(express.static(__dirname + '/node_modules/angular-animate'));

// for posts
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// client homepage
app.get('/', function(req, res){
    console.log( 'app.get(/)' );
    res.sendFile(__dirname + '/public/index.html');
});

// Default logger on all calls
app.use(function(req, res, next) {
    var now = new Date();
    console.log('Request: %s', now);
    console.log(req.query);
    console.log(req.url);
    //console.log(req);
    next();
});

//===============CLOUDANT===============
var user = "thomagr";
var password = "EJS-13grt";

//// service requests for redonly access to the database
//app.get('/players', function(req, res) {
//    console.log('app.get(/players)');
//
//    if(players.length){
//        res.send(players);
//        return console.log('Sending player cache');
//    }
//
//    Cloudant({
//        account: user,
//        password: password
//    }, function (er, cloudant) {
//        if (er) {
//            res.status(500).send(er.message);
//            return console.log('Error login: %s', er.message);
//        }
//        var db = cloudant.use("players");
//        db.list({include_docs: true}, function (err, body) {
//            if (err)
//                return console.log('Error list: %s', err.message);
//
//            // convert docs to an array of players and store in cache
//            var data = body.rows;
//
//            for (var i=0; i < data.length; i++){
//
//                players.push({
//                    name: data[i].doc.last_name + ', ' + data[i].doc.first_name,
//                    mobile: data[i].doc.mobile,
//                    home: data[i].doc.home,
//                    email: data[i].doc.email
//                });
//            }
//
//            players.sort(function(a,b){
//                return a.name.localeCompare(b.name)
//            });
//
//            res.send(players);
//        });
//    });
//});

var cache = {};

function deleteCache( cache, name ) {
    if( !cache[name] )
        return;

    // delete all objects by id
    var j = cache[name].length;

    while (j--) {
        if (cache[cache[name][j].id]) {
            console.log( 'deleting cache id ' + cache[name][j].id );
            delete cache[ cache[name][j].id ];
        }
    }
    console.log( 'deleting cache ' + name );
    delete cache[name];
}

function loadCache( cache, name, data ) {
    console.log( 'loading cache ' + name );
    cache[ name ] = data;
}

// service requests for readonly access to the database
app.get('/service', function(req, res) {
    console.log( 'app.get(/service)' );
    console.log(req.query);

    // provide the name of the database
    var name = req.query.name;

    // provide an id - optional
    var id = req.query.id;

    console.log( 'service request:' + name + ' id:' + id );

    if (typeof cache[ name ] != 'undefined' && typeof id == 'undefined' ) {
        console.log( 'from name cache' );
        res.send( cache[ name ] );
    } else if (typeof cache[ id ] != 'undefined' ) {
        console.log( 'from id cache' );
        res.send( cache[ id ] );
    } else
    Cloudant({
        account: user,
        password: password
    }, function(er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }

        if (typeof name == 'undefined')
            return res.status(400).send('error service name not defined');

        // use a database object
        var database = cloudant.use(name);

        // if id is not defined then get the list
        if (typeof id == 'undefined') {
            database.list({
                include_docs: true
            }, function(er, body) {
                if (er)
                    return console.log('Error list: %s', er.message);
                loadCache( cache, name, body );
                res.send(body);
            });
        } else {
            // use the id and get it
            database.get(id, function(er, body) {
                if (er)
                    return console.log('Error get: %s', er.message);
                loadCache( cache, id, body );
                res.send(body);
            });
        }
    });
});

app.post('/submitNewBoxleague', function(req, res) {
    console.log( 'app.post(/submitNewBoxleague)' );

    if (!req.body) {
        return res.status(400).send('missing boxleague data');
    }

    var boxleague = req.body;

    if(!boxleague.end){
        return res.status(400).send('missing boxleague end date');
    }

    if(!boxleague.start){
        return res.status(400).send('missing boxleague start date');
    }

    if(!boxleague.name){
        return res.status(400).send('missing boxleague name');
    }

    if(!boxleague.boxes && !boxleague.boxes.length){
        return res.status(400).send('missing boxleague boxes data');
    }

    Cloudant({
        account: user,
        password: password
    }, function(er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }

        var database = cloudant.use('boxleagues');

        database.insert(boxleague, function(er, body) {
            if (er)
                res.status(500).send(er.message);
        });
    });
});

var port = process.env.PORT || 9000;
app.listen(port);
console.log("listening on " + port + "!");
