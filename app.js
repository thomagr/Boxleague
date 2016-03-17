
var express = require('express'),
    http = require('http'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    Cloudant = require('cloudant'),
    passport = require('passport'),
    session = require('express-session'),
    uuid = require('node-uuid'),
    LocalStrategy = require('passport-local').Strategy;

//==================================================================
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log('checking password');
        var player = findByName(cache, username);
        if ( player && /*username === "admin" &&*/ password === "admin") { // stupid example
            console.log('user %s has logged in', username);
            return done(null, {
                name: username
            });
        }

        return done(null, false, {
            message: 'Incorrect login details.'
        });
    }
));

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Define a middleware function to be used for every secured routes
var auth = function(req, res, next) {
    console.log('checking isAuthenticated');
    if (!req.isAuthenticated()) {
        console.log('is Authenticated false');
        res.status(401).send("not authenticated");
    } else {
        console.log('is Authenticated true');
        next();
    };
};
//==================================================================

var app = express();

// Default logger on all calls
app.use(function(req, res, next) {
    var now = new Date();
    console.log('-----------------------------');
    console.log('Request  : %s', now);
    console.log('req.query: %s', JSON.stringify(req.query));
    console.log('req.url  : %s', req.url);
    console.log('req.user : %s', JSON.stringify(req.user));
    next();
});

// all environments
app.set('port', process.env.PORT || 9000);
app.use(cookieParser());
//app.use(bodyParser());
//app.use(express.methodOverride());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session()); // Add passport initialization
//app.use(app.router);

// client
app.use(express.static(__dirname + '/public/pages'));
app.use(express.static(__dirname + '/public'));

// for posts
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

//===============CLOUDANT===============
var user = "thomagr";
var password = "EJS-13grt";

var cache = {};

function deleteCache(cache, name) {
    if (!cache[name])
        return;

    // delete all objects by id
    var j = cache[name].length;

    while (j--) {
        if (cache[cache[name][j].id]) {
            console.log('deleting cache id ' + cache[name][j].id);
            delete cache[cache[name][j].id];
        }
    }
    console.log('deleting cache ' + name);
    delete cache[name];
}

function loadCache(cache, name, data) {
    console.log('loading cache ' + name);
    cache[name] = data;
}

var genuuid = uuid.v4();

//=============================Routes=================================
// route to homepage
app.get('/', function(req, res) {
    console.log('app.get(/)');
    res.sendFile(__dirname + '/public/index.html');
});

// route to test if the user is logged in or not
app.get('/loggedin', function(req, res) {
    console.log('/loggedin req.user: %s', JSON.stringify(req.user));

    if (req.isAuthenticated()) {
        var player = findByName(cache, req.user.name);
        if (!player) {
            req.logOut();
            res.status(401).send("Error not found");
        } else {
            res.send(player);
        }
    } else {
        res.send('0');
    }
});

// route to log in
app.post('/login', passport.authenticate('local'), function(req, res) {
    console.log('/login req.user: %s', JSON.stringify(req.user));

    var player = findByName(cache, req.user.name);
    if (!player) {
        req.logOut();
        res.status(401).send("Error not found");
    } else {
        res.send(player);
    }
});

// route to log out
app.post('/logout', function(req, res) {
    console.log('/logout');
    req.logOut();
    res.status(200).end();
});

Cloudant({
    account: user,
    password: password
}, function(er, cloudant) {
    if (er) {
        return console.log('Error login: %s', er.message);
    }

    // use a database object
    var database = cloudant.use("players");

    database.list({
        include_docs: true
    }, function(er, body) {
        if (er)
            return console.log('Error list: %s', er.message);

        loadCache(cache, 'players', body);
    });
});

function findByName(cache, name) {
    var source = cache['players'].rows;
    for (var i = 0; i < source.length; i++) {
        if (source[i].doc.name === name) {
            return source[i].doc;
        }
    }
    return;
}

// service requests for readonly access to the database
app.get('/service', auth, function(req, res) {
    console.log('app.get(/service)');
    console.log(req.query);

    // provide the name of the database
    var name = req.query.name;

    // provide an id - optional
    var id = req.query.id;

    console.log('service request:' + name + ' id:' + id);

    if (typeof cache[name] != 'undefined' && typeof id == 'undefined') {
        console.log('from name cache');
        res.send(cache[name]);
    } else if (typeof cache[id] != 'undefined') {
        console.log('from id cache');
        res.send(cache[id]);
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
                    loadCache(cache, name, body);
                    res.send(body);
                });
            } else {
                // use the id and get it
                database.get(id, function(er, body) {
                    if (er)
                        return console.log('Error get: %s', er.message);
                    loadCache(cache, id, body);
                    res.send(body);
                });
            }
        });
});

app.post('/submitNewBoxleague', auth, function(req, res) {
    console.log('app.post(/submitNewBoxleague)');

    if (!req.body) {
        return res.status(400).send('missing boxleague data');
    }

    var boxleague = req.body;

    if (!boxleague.end) {
        return res.status(400).send('missing boxleague end date');
    }

    if (!boxleague.start) {
        return res.status(400).send('missing boxleague start date');
    }

    if (!boxleague.name) {
        return res.status(400).send('missing boxleague name');
    }

    if (!boxleague.boxes && !boxleague.boxes.length) {
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

        var database = cloudant.use('boxleague');

        database.insert(boxleague, function(er, body) {
            if (er) {
                res.status(500).send(er.message);
            } else {
                res.status(200).end();
            }
        });
    });
});

app.post('/submitDoc', auth, function(req, res) {
    console.log('app.post(/submitDoc)');

    if (!req.body) {
        return res.status(400).send('missing data');
    }

    if (!req.body.database) {
        return res.status(400).send('missing database');
    }
    var databaseName = req.body.database;

    if (!req.body.doc) {
        return res.status(400).send('missing doc');
    }
    var doc = req.body.doc;

    Cloudant({
        account: user,
        password: password
    }, function(er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);

        console.log(doc);

        database.insert(doc, function(er, data) {
            console.log("Error:", er);
            console.log("Data:", data);
            if (er) {
                res.status(er.statusCode).send(er.reason);
            } else {
                res.status(200).send("saved");
            }
        });
    });
});

app.post('/submitDocs', auth, function(req, res) {
    console.log('app.post(/submitDocs)');

    if (!req.body) {
        return res.status(400).send('missing body');
    }

    if (!req.body.database) {
        return res.status(400).send('missing database');
    }
    var databaseName = req.body.database;

    if (!req.body.data) {
        return res.status(400).send('missing data');
    }
    var data = req.body.data

    Cloudant({
        account: user,
        password: password
    }, function(er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);
        var docs = {
            docs: data
        };

        console.log(docs);

        database.bulk(docs, function(er, data) {
            console.log("Error:", er);
            console.log("Data:", data);
            if (er) {
                res.status(er.statusCode).send(er.reason);
            } else {
                res.status(200).send(data);
            }
        });
    });
});

app.post('/submitNewPlayers', auth, function(req, res) {
    console.log('app.post(/submitNewPlayers)');

    if (!req.body) {
        return res.status(400).send('missing data');
    }

    var databaseName = "players";
    var data = [];
    req.body.forEach(function(player) {
        data.push({
            name: player.name,
            mobile: player.mobile,
            home: player.home,
            email: player.email
        });
    })

    Cloudant({
        account: user,
        password: password
    }, function(er, cloudant) {
        if (er) {
            res.status(500).send(er.message);
            return console.log('Error login: %s', er.message);
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);
        var docs = {
            docs: data
        };

        console.log(docs);

        database.bulk(docs, function(er, body) {
            if (er) {
                res.status(500).send(er.message);
            } else {
                res.send(200).end();
            }
        });
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});