var express = require('express'),
    http = require('http'),
//path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    Cloudant = require('cloudant'),
    passport = require('passport'),
    session = require('express-session'),
    uuid = require('node-uuid'),
    LocalStrategy = require('passport-local').Strategy,
    request = require('request'),
    nodemailer = require('nodemailer'),
    passwordHash = require('password-hash');

var tmpPassword = process.env.tmpPassword;

var emailUser = process.env.emailUsername;
var emailPassword = process.env.emailPassword;

var cloudantUser = process.env.cloudantUsername;
var cloudantProductionUser = process.env.cloudantProductionUser;
var cloudantPassword = process.env.cloudantPassword;

if (!tmpPassword || !emailUser || !emailPassword || !cloudantUser || !cloudantPassword || !cloudantProductionUser) {
    throw 'Mandatory environment variables have not been set.';
}

var production = cloudantUser === cloudantProductionUser;
console.info("Environment production: %s", production);
var environment = "Development";

if (production) {
    environment = "Production";
    console.debug = console.log;//function () {
    //};
} else {
    console.debug = console.log;
}

//==================================================================
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(function (username, password, done) {
    console.debug('checking password');

    var player = isRegisteredUser(cache, 'players', username);
    if (!player) {
        return done(null, false, {
            message: 'Incorrect login details.'
        });
    }

    var verify = false;
    var user = findOneCacheItem(cache, 'users', 'playerId', player._id);
    if (user) {
        verify = passwordHash.verify(password, user.password);
    } else {
        verify = password === tmpPassword;
    }

    if (verify) {
        console.info('User %s has logged in', username);
            return done(null, {
                name: username
            });
    } else {
        return done(null, false, {
            message: 'Incorrect login details.'
        });
    }
}));
// Serialized and deserialized methods when got from session
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
// Define a middleware function to be used for every secured routes
var auth = function (req, res, next) {
    console.debug('checking isAuthenticated');
    if (!req.isAuthenticated()) {
        console.debug('is Authenticated false');
        res.status(401).send("not authenticated");
    } else {
        console.debug('is Authenticated true');
        next();
    }
};
//==================================================================

var app = express();

// Default logger on all calls
app.use(function (req, res, next) {
    var now = new Date();
    console.debug('Request  : %s', now);
    console.debug('req.query: %s', JSON.stringify(req.query, null, 2));
    console.debug('req.url  : %s', req.url);
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
var cache = {};

function deleteCache(cache, name) {
    console.debug('deleting cache ' + name);

    if (!cache[name]){
        return
    }

    // delete all objects by id
    var j = cache[name].length;

    while (j--) {
        if (cache[cache[name][j].id]) {
            console.debug('deleting cache id ' + cache[name][j].id);
            delete cache[cache[name][j].id];
        }
    }
    delete cache[name];
}
// update - return true if found and updated
function updateCache(cache, name, data) {
    console.debug('updating cache ' + name);

    if (!cache[name]){
        cache[name] = [data];
        return
    }

    var obj = findOneCacheItem(cache, name, "_id", data._id);

    if (obj) {
        console.debug('Before: ' + JSON.stringify(obj, null, 2));
        Object.assign(obj, data);
        console.debug('After: ' + JSON.stringify(obj, null, 2));
    } else {
        cache[name].push(data);
    }

    return false;
}
function loadCache(cache, name, data) {
    console.info('loading cache %s with %d items', name, data.length);

    if(!cache[name]){
        cache[name] = data;
    } else {
        data.forEach(function(item){
            updateCache(cache, name, data);
        })
    }
}
// find items by an index and its id
function findCacheItem(cache, name, index, id) {
    console.debug('findCacheItem cache %s by %s == %s', name, index, id);

    var results = [];

    if (!cache[name]){
        console.debug('findCacheItem cache %s by %s == %s - not found', name, index, id);
        return
    }

    for(var i=0;i<cache[name].length;i++){
        if (id === cache[name][i][index]) {
            results.push(cache[name][i]);
        }
    }

    console.debug('findCacheItem cache %s by %s == %s - %d found', name, index, id, results.length);
    return results;
}
function findOneCacheItem(cache, name, index, id) {
    console.debug('findOneCacheItem cache %s by %s == %s', name, index, id);
    var find = findCacheItem(cache, name, index, id);
    if (find && find.length) {
        return find[0];
    } else {
        return undefined;
    }
}
function removeCacheItem(cache, name, data) {
    console.debug('removeCacheItem cache ' + name);

    if (!cache[name]){
        return
    }

    for(var index=0;index<cache[name].length;index++){
        if (data._id === cache[name][index]._id) {
            cache[name].splice( index, 1 );
            return;
        }
    }
}
function isRegisteredUser(cache, name, user) {
    console.debug('isRegisteredUser cache ' + name + ' user ' + user);

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

    console.error('User %s is not registered', user);
}

//=============================Routes=================================
// client
//app.use(express.static(__dirname + '/public/pages'));
app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + '/public/scripts'));
app.use(express.static(__dirname + '/public/pages'));
if(production){
    app.get('/scripts/env.js', function (req, res) {
        console.debug('app.get(/environment)');
        res.sendFile(__dirname + '/public/scripts/production/env.js');
    });
} else {
    app.get('/scripts/env.js', function (req, res) {
        console.debug('app.get(/environment)');
        res.sendFile(__dirname + '/public/scripts/development/env.js');
    });
}

// route to homepage
app.get('/', function (req, res) {
    console.debug('app.get(/)');
    res.sendFile(__dirname + '/public/index.html');
});
// route to test if the user is logged in or not
app.get('/loggedin', function (req, res) {
    console.debug('req.user : %s', JSON.stringify(req.user, null, 2));

    if (req.isAuthenticated()) {
        var player = isRegisteredUser(cache, 'players', req.user.name);
        if (!player) {
            req.logOut();
            res.status(401).send("User is not registered");
        } else {
            res.send(player);
        }
    } else {
        res.send('0');
    }
});
app.post('/login', passport.authenticate('local'), function (req, res) {
    console.debug('/login req.user: %s', JSON.stringify(req.user, null, 2));

    var player = isRegisteredUser(cache, 'players', req.user.name);
    if (!player) {
        req.logOut();
        res.status(401).send("Username not found.");
    } else {
        res.send(player);
    }
});
app.post('/logout', function (req, res) {
    console.debug('/logout');
    console.info('User %s has logged out', req.user.name);
    req.logOut();
    res.status(200).end();
});

app.post('/resetPassword', function (req, res) {
    console.debug('/resetPassword: %s', JSON.stringify(req.body, null, 2));

    var player = isRegisteredUser(cache, 'players', req.body.username);

    if (!player) {
        res.status(500).send("Username not found.");
        return;
    }

    if (!player.email) {
        res.status(500).send("User does not have an email address. Please contact your administrator.");
        return;
    }

    var textPassword = Math.random().toString(36).substr(2, 8);
    var hashPassword = passwordHash.generate(textPassword);

    var data = {
        playerId: player._id,
        password: hashPassword
    };

    var user = findOneCacheItem(cache, 'users', 'playerId', player._id);
    if (user) {
        data._id = user._id;
        data._rev = user._rev;
    }

    updateDoc(data, "users", res, function () {
        var message = {
            to: [player.email], subject: "Boxleague password reset",
            text: "Your password has been reset to " + textPassword + ".\nPlease login and update your password by going to your settings."
        };
        sendMailFunction(message);
    });
});
app.post('/password', auth, function (req, res) {
    console.debug('/password: %s', JSON.stringify(req.body, null, 2));

    var player = isRegisteredUser(cache, 'players', req.body.username);

    if (!player) {
        res.status(500).send("Username not found.");
        return;
    }

    if (!player.email) {
        res.status(500).send("User does not have an email address. Please add an email address in settings.");
        return;
    }

    var currentPassword = req.body.current;
    var textPassword = req.body.password;
    var hashPassword = passwordHash.generate(textPassword);

    var verify = false;
    var user = findOneCacheItem(cache, 'users', 'playerId', player._id);
    if (user) {
        verify = passwordHash.verify(currentPassword, user.password);
    } else {
        verify = currentPassword === tmpPassword;
    }

    if (!verify) {
        res.status(500).send("Current password did not match.");
        return;
    }

    var data = {
        playerId: player._id,
        password: hashPassword
    };

    if (user) {
        data._id = user._id;
        data._rev = user._rev;
    }

    updateDoc(data, "users", res, function () {
        var message = {
            to: [player.email], subject: "Boxleague password saved",
            text: "Your new password has been saved."
        };
        sendMailFunction(message);
    });
});

var readDoc = function (name, res, id) {
    console.debug('readDoc %s', name);

    if(id) {
        var item = findOneCacheItem(cache, name, "_id", id);
        if (item) {
            console.debug("returning item from cache");
            res.send(item);
            return;
        }
    } else if(cache[name]) {
        console.debug("returning cache");
        res.send(cache[name]);
        return;
    }

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.error('Error login: %s', error.reason);
            if (res) {
                res.status(500).send(error.reason)
            }
            return;
        }

        // use a database object
        var database = cloudant.use(name);

        // if id is not defined then get the list
        if (typeof id === 'undefined') {
            database.list({include_docs: true}, function (error, response) {
                if (error) {
                    console.error('Error list %s: %s', name, error.reason);
                    if (res) {
                        res.status(error.statusCode).send(error.reason)
                    }
                    return;
                }
                // convert the output from docs to objects
                var rows = response.rows;
                var items = [];
                rows.forEach(function (item) {
                    if (!(item.doc.language && item.doc.views)) { // filter out views
                        items.push(item.doc);
                    }
                });
                loadCache(cache, name, items);
                if (res) {
                    res.send(items)
                }
            });
        } else {
            // use the id and get it
            database.get(id, function (er, body) {
                if (er) {
                    console.error('Error get: %s', er.reason);
                    if (res) {
                        res.status(er.statusCode).send(er.reason)
                    }
                    return;
                }
                if (res) {
                    updateCache(cache, name, body);
                    res.send(body)
                }
            });
        }
    });
};
var findDocs = function (name, index, id, res) {
    console.debug('findDocs %s by %s == %s', name, index, id);

    // can't use the cache because we don't know if its all loaded
    // var item = findCacheItem(cache, name, index, id);
    // if (item && item.length) {
    //     console.debug("returning item from cache");
    //     res.send(item);
    //     return;
    // }

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.error('Error login: %s', error.reason);
            if (res) {
                res.status(500).send(error.reason)
            }
            return;
        }

        // use a database object
        var database = cloudant.use(name);

        var selector = {};
        selector[index] = id;

        database.find({selector:selector}, function (er, response) {
            if (er) {
                console.error('Error find: %s', er.reason);
                if(res){res.status(er.statusCode).send(er.reason)}
                return;
            }
            if (res) {
                // don't load the cache
                //loadCache(cache, name, response.docs);
                res.send(response.docs)
            }
        });
    });
};
var updateDoc = function (data, name, res, success, fail) {
    console.debug('updateDoc %s', name);
    console.debug(JSON.stringify(data, null, 2));

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.error('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            if (fail) {
                fail(error.reason);
            }
            return;
        }

        var database = cloudant.use(name);

        database.insert(data, function (error, response) {
            if (error) {
                console.error('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
                if (fail) {
                    fail(error.reason);
                }
            } else {
                console.debug("Data:", JSON.stringify(response, null, 2));
                data._id = response.id;
                data._rev = response.rev;
                updateCache(cache, name, data);
                res.status(200).send(response);
                if (success) {
                    success();
                }
            }
        });
    });
};
var bulkUpdateDoc = function (data, name, res) {
    console.debug('bulkUpdateDoc %s', name);
    console.debug(JSON.stringify(data, null, 2));

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.error('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            return;
        }

        var database = cloudant.use(name);
        var docs = {docs: data};
        database.bulk(docs, function (error, response) {
            if (error) {
                console.error('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
            } else {
                console.debug("Response:", JSON.stringify(response, null, 2));
                for(var i=0;i<response.length;i++){
                    data[i]._id =response[i].id;
                    data[i]._rev =response[i].rev;
                }
                console.debug("Data:", JSON.stringify(data, null, 2));
                deleteCache(cache, name);
                res.status(200).send(data);
            }
        });
    });
};
var deleteDoc = function (id, rev, name, res) {
    console.debug('deleteDoc %s', name);
    console.debug('id: %s, rev: %s', id, rev);
    if(!id || !rev){
        res.status(500).send("id or rev missing in delete request");
        return;
    }

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.error('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            return;
        }

        var database = cloudant.use(name);

        database.destroy(id, rev, function (error, response) {
            if (error) {
                console.error('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
            } else {
                console.debug("Data:", JSON.stringify(response, null, 2));
                response._id = response.id; // because the response had id and not _id
                removeCacheItem(cache, name, response);
                res.status(200).send(response);
            }
        });
    });
};

app.get('/player/:id', auth, function (req, res) {
    readDoc("players", res, req.params.id);
});
app.post('/player/:id', auth, function (req, res) {
    updateDoc(req.body, "players", res);
});
app.delete('/player/:id/:rev', auth, function (req, res) {
    deleteDoc(req.params.id, req.params.rev, "players", res);
});
app.get('/players', auth, function (req, res) {
    readDoc("players", res);
});
app.post('/players', auth, function (req, res) {
    bulkUpdateDoc(req.body, "players", res);
});

app.get('/game/:id', auth, function (req, res) {
    readDoc("games", res, req.params.id);
});
app.post('/game/:id', auth, function (req, res) {
    updateDoc(req.body, "games", res);
});
app.delete('/game/:id/:rev', auth, function (req, res) {
    deleteDoc(req.params.id, req.params.rev, "games", res);
});
app.get('/games', auth, function (req, res) {
    readDoc("games", res);
});
app.get('/games/:field/:id', auth, function (req, res) {
    findDocs("games", req.params.field, req.params.id, res, false);
});
app.post('/games', auth, function (req, res) {
    bulkUpdateDoc(req.body, "games", res);
});

app.get('/boxleague/:id', auth, function (req, res) {
    readDoc("boxleagues", res, req.params.id);
});
app.post('/boxleague/:id', auth, function (req, res) {
    updateDoc(req.body, "boxleagues", res);
});
app.delete('/boxleague/:id/:rev', auth, function (req, res) {
    deleteDoc(req.params.id, req.params.rev, "boxleagues", res);
});
app.get('/boxleagues', auth, function (req, res) {
    readDoc("boxleagues", res);
});
app.get('/boxleagues/:active', auth, function (req, res) {
    findDocs("boxleagues", "active", req.params.active, res);
});
app.post('/boxleagues', auth, function (req, res) {
    bulkUpdateDoc(req.body, "boxleagues", res);
});

app.post('/submitDoc', auth, function (req, res) {
    console.debug('app.post(/submitDoc)');

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
    console.debug('app.post(/submitDocs)');

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
    var data = req.body.data;

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (er, cloudant) {
        if (er) {
            console.debug('Error login: %s', er.reason);
            res.status(500).send(er.reason);
            return;
        }

        var database = cloudant.use(databaseName);
        deleteCache(cache, databaseName);
        var docs = {docs: data};

        console.debug(docs);

        database.bulk(docs, function (er, data) {
            console.debug("Error:", er);
            console.debug("Data:", data);
            if (er) {
                res.status(er.statusCode).send(er.reason);
            } else {
                res.status(200).send(data);
            }
        });
    });
});

//=============================Weather=================================
var weatherDaily = [];
var weatherHourly = [];
var appId = 'dfa92a2daab9476f51718353645f1c85';

app.get('/weatherDaily', auth, function (req, res) {
    console.debug('app.get(/weatherDaily)');
    console.debug(req.query);

    var location = req.query.location;
    var days = '5';

    if (weatherDaily[location]) {
        console.debug('sending from cache');
        res.status(200).send(weatherDaily[location]);
        return;
    }

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
    console.debug('app.get(/weatherHourly)');
    console.debug(req.query);

    var location = req.query.location;
    var hours = '5';

    if (weatherHourly[location]) {
        console.debug('sending from cache');
        res.status(200).send(weatherHourly[location]);
        return;
    }

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
    console.debug('refreshing weather cache');
    weatherDaily = [];
    weatherHourly = [];
}, 1000 * 60 * 60);

//=============================Emailing=================================
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport("SMTP", {
    service: "iCloud",  // sets automatically host, port and connection security settings
    auth: {
        user: emailUser,
        pass: emailPassword
    }
});

var mailOptions = {
    from: "Boxleague<" + emailUser + "@icloud.com>", // sender address
    to: emailUser + "@icloud.com", // comma delimited list of receivers
    subject: environment + " start up", // Subject line
    text: "Boxleague starting" // plain body
};

var sendMailFunction = function (message, success, fail) {
    var email = {};
    email.from = mailOptions.from;
    email.to = message.to.join(",");
    email.subject = message.subject;
    email.text = message.text;
    email.text += "\n\nSupport email: " + mailOptions.from;

    console.debug(JSON.stringify(email, null, 2));

    // send mail with defined transport object
    try {
        transporter.sendMail(email, function (error, info) {
            if (error) {
                console.debug('Message error: ' + error);
                if (fail) {
                    fail(error);
                }
            } else {
                console.debug('Message sent: ' + JSON.stringify(info, null, 2));
                if (success) {
                    success(info);
                }
            }
        });
    }
    catch (error) {
        console.debug('Message exception error: ' + error);
        fail(error);
    }
};
var sendMail = function (message, res) {
    sendMailFunction(message, function (info) {
        res.status(200).send(info);
    }, function (error) {
        res.status(500).send(error);
    });
};

app.post('/message', auth, function (req, res) {
    console.debug(req.url);

    var message = req.body;
    sendMail(message, res);
});

console.debug(JSON.stringify(mailOptions, null, 2));

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        return console.debug(error);
    }
    console.debug('Message sent: ' + JSON.stringify(info, null, 2));
});

// initialise the players list to allow for logins
readDoc("players");
readDoc("users");
readDoc("boxleagues");

http.createServer(app).listen(app.get('port'), function () {
    console.info('Express server listening on port ' + app.get('port'));
});
