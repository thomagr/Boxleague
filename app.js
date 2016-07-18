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

//==================================================================
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(function (username, password, done) {
    console.log('checking password');

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
            console.log('user %s has logged in', username);
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
var production = cloudantUser === cloudantProductionUser;
console.log("Environment production: %s", production);

var cache = {};

function deleteCache(cache, name) {
    console.log('deleting cache ' + name);

    if (!cache[name]){
        return
    }

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
// update - return true if found and updated
function updateCache(cache, name, data) {
    console.log('updating cache ' + name);

    if (!cache[name]){
        return
    }

    for(var index=0;index<cache[name].length;index++){
        if (data._id === cache[name][index]._id) {
            console.log('Before: ' + JSON.stringify(cache[name][index]));
            cache[name][index] = data;
            console.log('After: ' + JSON.stringify(cache[name][index]));
            return true;
        }
    }
    return false;
}
function loadCache(cache, name, data) {
    console.log('loading cache %s with %d items', name, data.length);

    if(!cache[name]){
        cache[name] = data;
    } else {
        data.forEach(function(item){
            if(!updateCache(cache, name, data)){
                cache[name].push(item);
            }
        })
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
function findOneCacheItem(cache, name, index, id) {
    console.log('findOneCacheItem cache %s by %s == %s', name, index, id);
    var find = findCacheItem(cache, name, index, id);
    if (find && find.length) {
        return find[0];
    } else {
        return undefined;
    }
}
function removeCacheItem(cache, name, data) {
    console.log('removeCacheItem cache ' + name);

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
            res.status(401).send("User is not registered");
        } else {
            res.send(player);
        }
    } else {
        res.send('0');
    }
});
app.post('/login', passport.authenticate('local'), function (req, res) {
    console.log('/login req.user: %s', JSON.stringify(req.user));

    var player = isRegisteredUser(cache, 'players', req.user.name);
    if (!player) {
        req.logOut();
        res.status(401).send("User is not registered");
    } else {
        res.send(player);
    }
});
app.post('/logout', function (req, res) {
    console.log('/logout');
    req.logOut();
    res.status(200).end();
});

app.post('/resetPassword', function (req, res) {
    console.log('/resetPassword: %s', JSON.stringify(req.body));

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
    console.log('/password: %s', JSON.stringify(req.body));

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

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
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

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
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
var updateDoc = function (data, name, res, success, fail) {
    console.log('updateDoc %s', name);
    console.log(JSON.stringify(data));

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
        if (error) {
            console.log('Error login: %s', error.reason);
            res.status(500).send(error.reason);
            if (fail) {
                fail(error.reason);
            }
            return;
        }

        var database = cloudant.use(name);

        database.insert(data, function (error, response) {
            if (error) {
                console.log('Error list %s: %s', name, error.reason);
                res.status(error.statusCode).send(error.reason);
                if (fail) {
                    fail(error.reason);
                }
            } else {
                console.log("Data:", JSON.stringify(response));
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
    console.log('bulkUpdateDoc %s', name);
    console.log(JSON.stringify(data));

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
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
                console.log("Response:", JSON.stringify(response));
                for(var i=0;i<response.length;i++){
                    data[i]._id =response[i].id;
                    data[i]._rev =response[i].rev;
                }
                console.log("Data:", JSON.stringify(data));
                deleteCache(cache, name);
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

    Cloudant({account: cloudantUser, password: cloudantPassword}, function (error, cloudant) {
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
    var data = req.body.data;

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

//=============================Weather=================================
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
    subject: "Start up", // Subject line
    text: "Boxleague starting" // plain body
};

var sendMailFunction = function (message, success, fail) {
    var email = {};
    email.from = mailOptions.from;
    email.to = message.to.join(",");
    email.subject = message.subject;
    email.text = message.text;
    email.text += "\n\nSupport email: " + mailOptions.from;

    console.log(JSON.stringify(email));

    // send mail with defined transport object
    try {
        transporter.sendMail(email, function (error, info) {
            if (error) {
                console.log('Message error: ' + error);
                if (fail) {
                    fail(error);
                }
            } else {
                console.log('Message sent: ' + JSON.stringify(info));
                if (success) {
                    success(info);
                }
            }
        });
    }
    catch (error) {
        console.log('Message exception error: ' + error);
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
    console.log(req.url);

    var message = req.body;
    sendMail(message, res);
});

console.log(JSON.stringify(mailOptions));

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: ' + JSON.stringify(info));
});

// initialise the players list to allow for logins
readDoc("players");
readDoc("users");

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
