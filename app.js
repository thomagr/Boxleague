var express = require('express'),
    http = require('http'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    Cloudant = require('cloudant'),
    passport = require('passport'),
    session = require('express-session'),
    uuid = require('node-uuid'),
    LocalStrategy = require('passport-local').Strategy,
    request = require('request');

//==================================================================
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(function (username, password, done) {
        console.log('checking password');
        var player = isRegisteredUser(cache, 'players', username);
        if (player && /*username === "admin" &&*/ password === "t3nn1s") {
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
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
// Define a middleware function to be used for every secured routes
var auth = function (req, res, next) {
    console.log('checking isAuthenticated');
    if (!req.isAuthenticated()) {
        console.log('is Authenticated false');
        res.status(401).send("not authenticated");
    } else {
        console.log('is Authenticated true');
        next();
    }
};
//==================================================================

var app = express();

// Default logger on all calls
app.use(function (req, res, next) {
    var now = new Date();
    console.log('-----------------------------');
    console.log('Request  : %s', now);
    console.log('req.query: %s', JSON.stringify(req.query));
    console.log('req.url  : %s', req.url);
    next();
});

// all environments
app.set('port', process.env.PORT || 9000);
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session()); // Add passport initialization

// for posts
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
}));

//===============CLOUDANT===============
var user = "boxleague";
var password = "w1mbl3don3";
// var user = "thomagr";
// var password = "EJS-13grt";
var production = user === "boxleague";
console.log("Environment production: %s", production);

var cache = {};

function deleteCache(cache, name) {
    console.log('deleting cache ' + name);

    if (!cache[name]){
        return
    };

    // delete all objects by id
    var j = cache[name].length;

    while (j--) {
        if (cache[cache[name][j].id]) {
            console.log('deleting cache id ' + cache[name][j].id);
            delete cache[cache[name][j].id];
        }
    }
    delete cache[name];
}
function loadCache(cache, name, data) {
    console.log('loading cache ' + name);

    if(!cache[name]){
        cache[name] = data;
    } else {
        data.forEach(function(item){
            cache[name].push(item);
        })
    }
}
function updateCache(cache, name, data) {
    console.log('updating cache ' + name);

    if (!cache[name]){
        return
    };

    for(var index=0;index<cache[name].length;index++){
        if (data._id === cache[name][index]._id) {
            console.log('Before: ' + JSON.stringify(cache[name][index]));
            cache[name][index] = data;
            console.log('After: ' + JSON.stringify(cache[name][index]));
            return;
        }
    }
}
function readCacheItem(cache, name, id) {
    console.log('readCacheItem cache ' + name);

    if (!cache[name]){
        return
    }

    for(var i=0;i<cache[name].length;i++){
        if (id === cache[name][i]._id) {
            return cache[name][i];
        }
    }
}
// find items by an index and its id
function findCacheItem(cache, name, index, id) {
    console.log('findCacheItem cache %s by %s == %s', name, index, id);

    var results = [];

    if (!cache[name]){
        return
    }

    for(var i=0;i<cache[name].length;i++){
        if (id === cache[name][i][index]) {
            results.push(cache[name][i]);
        }
    }
    return results;
}
function removeCacheItem(cache, name, data) {
    console.log('removeCacheItem cache ' + name);

    if (!cache[name]){
        return
    };

    for(var index=0;index<cache[name].length;index++){
        if (data._id === cache[name][index]._id) {
            cache[name].splice( index, 1 );
            return;
        }
    }
}
function isRegisteredUser(cache, name, user) {
    console.log('isRegisteredUser cache ' + name + ' user ' + user);

    if(cache[name]){
        for (var i = 0; i < cache[name].length; i++) {
            if (cache[name][i].name === user) {
                return cache[name][i];
            }
        }
    }

    if(user === "Graham Thomas"){
        return {name: "Graham Thomas"};
    } else if(user === "Admin"){
        return {name: "Admin"};
    }
}

var genuuid = uuid.v4();

//=============================Routes=================================
// client
//app.use(express.static(__dirname + '/public/pages'));
app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + '/public/scripts'));
app.use(express.static(__dirname + '/public/pages'));
if(production){
    app.get('/scripts/env.js', function (req, res) {
        console.log('app.get(/environment)');
        res.sendFile(__dirname + '/public/scripts/production/env.js');
    });
} else {
    app.get('/scripts/env.js', function (req, res) {
        console.log('app.get(/environment)');
        res.sendFile(__dirname + '/public/scripts/development/env.js');
    });
}

// route to homepage
app.get('/', function (req, res) {
    console.log('app.get(/)');
    res.sendFile(__dirname + '/public/index.html');
});

// route to test if the user is logged in or not
app.get('/loggedin', function (req, res) {
    console.log('req.user : %s', JSON.stringify(req.user));

    if (req.isAuthenticated()) {
        var player = isRegisteredUser(cache, 'players', req.user.name);
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
app.post('/login', passport.authenticate('local'), function (req, res) {
    console.log('/login req.user: %s', JSON.stringify(req.user));

    var player = isRegisteredUser(cache, 'players', req.user.name);
    if (!player) {
        req.logOut();
        res.status(401).send("Error not found");
    } else {
        res.send(player);
    }
});
// route to log out
app.post('/logout', function (req, res) {
    console.log('/logout');
    req.logOut();
    res.status(200).end();
});

// service requests for readonly access to the database
// app.get('/service', auth, function (req, res) {
//     console.log('app.get(/service)');
//     console.log(req.query);
//
//     // provide the name of the database
//     var name = req.query.name;
//
//     // provide an id - optional
//     var id = req.query.id;
//
//     console.log('service request:' + name + ' id:' + id);
//
//     if (typeof cache[name] != 'undefined' && typeof id == 'undefined') {
//         console.log('from name cache');
//         res.send(cache[name]);
//     } else if (typeof cache[id] != 'undefined') {
//         console.log('from id cache');
//         res.send(cache[id]);
//     } else {
//         Cloudant({account: user, password: password}, function (er, cloudant) {
//             if (er) {
//                 console.log('Error login: %s', er.reason);
//                 res.status(500).send(er.reason);
//                 return;
//             }
//
//             if (typeof name == 'undefined') {
//                 res.status(400).send('error service name not defined');
//                 return;
//             }
//
//             // use a database object
//             var database = cloudant.use(name);
//
//             // if id is not defined then get the list
//             if (typeof id == 'undefined') {
//                 database.list({include_docs: true}, function (er, body) {
//                     if (er) {
//                         console.log('Error login: %s', er.reason);
//                         res.status(er.statusCode).send(er.reason);
//                         return;
//                     }
//                     loadCache(cache, name, body);
//                     res.send(body);
//                 });
//             } else {
//                 // use the id and get it
//                 database.get(id, function (er, body) {
//                     if (er) {
//                         console.log('Error login: %s', er.reason);
//                         res.status(er.statusCode).send(er.reason);
//                         return;
//                     }
//                     loadCache(cache, id, body);
//                     res.send(body);
//                 });
//             }
//         });
//     }
// });

var readDoc = function (name, res, id) {
    console.log('readDoc %s', name);

    if(id) {
        var item = readCacheItem(cache, name, id);
        if (item) {
            console.log("returning item from cache");
            res.send(item);
            return;
        }
    } else if(cache[name]) {
        console.log("returning cache");
        res.send(cache[name]);
        return;
    }

    Cloudant({account: user, password: password}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            if(res){res.status(500).send(error.reason)};
            return;
        }

        // use a database object
        var database = cloudant.use(name);

        // if id is not defined then get the list
        if (typeof id === 'undefined') {
            database.list({include_docs: true}, function (error, response) {
                if (error) {
                    console.log('Error list %s: %s', name, error.reason);
                    if(res){res.status(error.statusCode).send(error.reason)}
                    return;
                }
                // convert the output from docs to objects
                var rows = response.rows;
                var items = [];
                rows.forEach(function(item){
                    items.push(item.doc);
                });
                loadCache(cache, name, items);
                if(res){res.send(items)}
            });
        } else {
            // use the id and get it
            database.get(id, function (er, body) {
                if (er) {
                    console.log('Error login: %s', er.reason);
                    if(res){res.status(er.statusCode).send(er.reason)}
                    return;
                }
                if(res){res.send(body)}
            });
        }
    });
};
var findDocs = function (name, index, id, res) {
    console.log('findDocs %s by %s == %s', name, index, id);

    var item = findCacheItem(cache, name, index, id);
    if (item && item.length) {
        console.log("returning item from cache");
        res.send(item);
        return;
    }

    Cloudant({account: user, password: password}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            if(res){res.status(500).send(error.reason)}
            return;
        }

        // use a database object
        var database = cloudant.use(name);

        var selector = {};
        selector[index] = id;

        database.find({selector:selector}, function (er, response) {
            if (er) {
                console.log('Error login: %s', er.reason);
                if(res){res.status(er.statusCode).send(er.reason)}
                return;
            }
            if(res){res.send(response.docs)}
        });
    });
};

//findDocs("games", "boxleagueId", "21506efae2378b137e169013c478366b");
//findDocs("boxleagues", "active", "yes");

var updateDoc = function (data, name, res) {
    console.log('updateDoc %s', name);
    console.log(JSON.stringify(data));

    Cloudant({account: user, password: password}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            return;
        }

        var database = cloudant.use(name);

        database.insert(data, function (error, response) {
            if (error) {
                console.log('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
            } else {
                console.log("Data:", JSON.stringify(response));
                data._id = response.id;
                data._rev = response.rev;
                updateCache(cache, name, data);
                res.status(200).send(response);
            }
        });
    });
};
var bulkUpdateDoc = function (data, name, res) {
    console.log('bulkUpdateDoc %s', name);
    console.log(JSON.stringify(data))

    Cloudant({account: user, password: password}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            return;
        }

        var database = cloudant.use(name);
        var docs = {docs: data};
        database.bulk(docs, function (error, response) {
            if (error) {
                console.log('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
            } else {
                console.log("Data:", JSON.stringify(response));
                for(var i=0;i<response.length;i++){
                    data[i]._id =response[i].id;
                    data[i]._rev =response[i].rev;
                }
                loadCache(cache, name, data);
                res.status(200).send(data);
            }
        });
    });
};
var deleteDoc = function (id, rev, name, res) {
    console.log('deleteDoc %s', name);
    console.log('id: %s, rev: %s', id, rev);
    if(!id || !rev){
        res.status(500).send("id or rev missing in delete request");
        return;
    }

    Cloudant({account: user, password: password}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            return;
        }

        var database = cloudant.use(name);

        database.destroy(id, rev, function (error, response) {
            if (error) {
                console.log('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
            } else {
                console.log("Data:", JSON.stringify(response));
                response._id = response.id; // because the response had id and not _id
                removeCacheItem(cache, name, response);
                res.status(200).send(response);
            }
        });
    });
};

// initialise the players list to allow for logins
readDoc("players");
//readDoc("boxleagues");
//readDoc("games");

app.get('/player/:id', auth, function (req, res) {
    console.log(req.url);
    readDoc("players", res, req.params.id);
});
app.post('/player/:id', auth, function (req, res) {
    console.log(req.url);
    updateDoc(req.body, "players", res);
});
app.delete('/player/:id/:rev', auth, function (req, res) {
    console.log(req.url);
    deleteDoc(req.params.id, req.params.rev, "players", res);
});
app.get('/players', auth, function (req, res) {
    console.log(req.url);
    readDoc("players", res);
});
app.post('/players', auth, function (req, res) {
    console.log(req.url);
    bulkUpdateDoc(req.body, "players", res);
});

app.get('/game/:id', auth, function (req, res) {
    console.log(req.url);
    readDoc("games", res, req.params.id);
});
app.post('/game/:id', auth, function (req, res) {
    console.log(req.url);
    updateDoc(req.body, "games", res);
});
app.delete('/game/:id/:rev', auth, function (req, res) {
    console.log(req.url);
    deleteDoc(req.params.id, req.params.rev, "games", res);
});
app.get('/games', auth, function (req, res) {
    console.log(req.url);
    readDoc("games", res);
});
app.get('/games/:field/:id', auth, function (req, res) {
    console.log(req.url);
    findDocs("games", req.params.field, req.params.id, res);
});
app.post('/games', auth, function (req, res) {
    console.log(req.url);
    bulkUpdateDoc(req.body, "games", res);
});

app.get('/boxleague/:id', auth, function (req, res) {
    console.log(req.url);
    readDoc("boxleagues", res, req.params.id);
});
app.post('/boxleague/:id', auth, function (req, res) {
    console.log(req.url);
    updateDoc(req.body, "boxleagues", res);
});
app.delete('/boxleague/:id/:rev', auth, function (req, res) {
    console.log(req.url);
    deleteDoc(req.params.id, req.params.rev, "boxleagues", res);
});
app.get('/boxleagues', auth, function (req, res) {
    console.log(req.url);
    readDoc("boxleagues", res);
});
app.get('/boxleagues/:active', auth, function (req, res) {
    console.log(req.url);
    findDocs("boxleagues", "active", req.params.active, res);
});
app.post('/boxleagues', auth, function (req, res) {
    console.log(req.url);
    bulkUpdateDoc(req.body, "boxleagues", res);
});

app.post('/submitDoc', auth, function (req, res) {
    console.log('app.post(/submitDoc)');

    if (!req.body) {
        res.status(400).send('missing data');
        return;
    }

    if (!req.body.database) {
        res.status(400).send('missing database');
        return;
    }
    var databaseName = req.body.database;

    if (!req.body.doc) {
        res.status(400).send('missing doc');
        return;
    }
    var doc = req.body.doc;

    updateDoc(doc, databaseName, res);
});
app.post('/submitDocs', auth, function (req, res) {
    console.log('app.post(/submitDocs)');

    if (!req.body) {
        res.status(400).send('missing body');
        return;
    }

    if (!req.body.database) {
        res.status(400).send('missing database');
        return;
    }
    var databaseName = req.body.database;

    if (!req.body.data) {
        res.status(400).send('missing data');
        return;
    }
    var data = req.body.data

    Cloudant({account: user, password: password}, function (er, cloudant) {
        if (er) {
            console.log('Error login: %s', er.reason);
            res.status(500).send(er.reason);
            return;
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);
        var docs = {docs: data};

        console.log(docs);

        database.bulk(docs, function (er, data) {
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
app.post('/submitNewPlayers', auth, function (req, res) {
    console.log('app.post(/submitNewPlayers)');

    if (!req.body) {
        return res.status(400).send('missing data');
    }

    var databaseName = "players";
    var data = [];
    req.body.forEach(function (player) {
        data.push({
            name: player.name,
            mobile: player.mobile,
            home: player.home,
            email: player.email
        });
    })

    Cloudant({account: user, password: password}, function (er, cloudant) {
        if (er) {
            console.log('Error login: %s', er.reason);
            res.status(500).send(er.reason);
            return;
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);
        var docs = {docs: data};

        console.log(docs);

        database.bulk(docs, function (er, data) {
            if (er) {
                res.status(er.statusCode).send(er.reason);
            } else {
                res.status(200).send(data);
            }
        });
    });
});
app.post('/submitNewBoxleague', auth, function (req, res) {
    console.log('app.post(/submitNewBoxleague)');

    if (!req.body) {
        res.status(400).send('missing boxleague data');
        return;
    }

    var boxleague = req.body;

    if (!boxleague.end) {
        res.status(400).send('missing boxleague end date');
        return;
    }

    if (!boxleague.start) {
        res.status(400).send('missing boxleague start date');
        return;
    }

    if (!boxleague.name) {
        res.status(400).send('missing boxleague name');
        return;
    }

    if (!boxleague.boxes && !boxleague.boxes.length) {
        res.status(400).send('missing boxleague boxes data');
        return;
    }

    Cloudant({account: user, password: password}, function (er, cloudant) {
        if (er) {
            console.log('Error login: %s', er.reason);
            res.status(500).send(er.reason);
            return;
        }

        var database = cloudant.use('boxleague');

        database.insert(boxleague, function (er, body) {
            if (er) {
                res.status(400).send(er.message);
            } else {
                res.status(200).end();
            }
        });
    });
});

// stuff for the weather
var weatherDaily = [];
var weatherHourly = [];
var appId = 'dfa92a2daab9476f51718353645f1c85';

app.get('/weatherDaily', auth, function (req, res) {
    console.log('app.get(/weatherDaily)');
    console.log(req.query);

    var location = req.query.location;
    var days = '5';

    if (weatherDaily[location]) {
        console.log('sending from cache');
        res.status(200).send(weatherDaily[location]);
        return;
    }
    ;

    var requestUrl = 'http://api.openweathermap.org/data/2.5/forecast/daily?q=' + location + '&cnt=' + days + '&appid=' + appId + '&format=json';

    request(requestUrl, function (er, response, data) {
        if (er) {
            res.status(500).send(er.reason);
        } else {
            weatherDaily[location] = data;
            res.status(200).send(data);
        }
    });
});
app.get('/weatherHourly', auth, function (req, res) {
    console.log('app.get(/weatherHourly)');
    console.log(req.query);

    var location = req.query.location;
    var hours = '5';

    if (weatherHourly[location]) {
        console.log('sending from cache');
        res.status(200).send(weatherHourly[location]);
        return;
    }
    ;

    var requestUrl = 'http://api.openweathermap.org/data/2.5/forecast?q=' + location + '&cnt=' + hours + '&appid=' + appId + '&format=json';

    request(requestUrl, function (er, response, data) {
        if (er) {
            res.status(500).send(er.reason);
        } else {
            weatherHourly[location] = data;
            res.status(200).send(data);
        }
    });
});
// reset the weather cache every hour
setInterval(function () {
    console.log('refreshing weather cache');
    weatherDaily = [];
    weatherHourly = [];
}, 1000 * 60 * 60);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
