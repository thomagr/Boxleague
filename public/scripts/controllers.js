// CONTROLLERS

boxleagueApp.controller('forcastCtrl', ['$scope', '$log', '$resource', '$routeParams', function ($scope, $log, $resource, $routeParams) {
    $log.info("forcastCtrl");

    $scope.location = $routeParams.location;
    $scope.days = '5';
    $scope.hours = '4';
    $scope.appId = 'dfa92a2daab9476f51718353645f1c85'

    $scope.dailyWeatherAPI = $resource("http://api.openweathermap.org/data/2.5/forecast/daily", { callback: "JSON_CALLBACK" }, { get: { method: "JSONP" }});
    $scope.hourlyWeatherAPI = $resource("http://api.openweathermap.org/data/2.5/forecast", { callback: "JSON_CALLBACK" }, { get: { method: "JSONP" }});

    $scope.dailyWeatherAPI.get({ q: $scope.location, cnt: $scope.days, appid: $scope.appId }, function(data){
            $scope.dailyWeatherResult = data;
        }).$promise.then( function( data){
        return $scope.hourlyWeatherAPI.get({ id: $scope.dailyWeatherResult.city.id, cnt: $scope.hours, appid: $scope.appId }, function(data){
            $scope.hourlyWeatherResult = data;
        });
    });

    $scope.convertToDegC = function(degK) {
        return Math.round(degK - 273.15);
    };

    $scope.convertToDate = function(dt) {
        return new Date(dt * 1000);
    };
}]);

boxleagueApp.controller('welcomeCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("welcomeCtrl");

    // reset on the welcome screen only
    $rootScope.alerts = [];
}]);

boxleagueApp.controller('playerCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("playerCtrl");

    $scope.id = $routeParams.id;

    var success = function(players){
        $rootScope.players = players;
        players.forEach(function(player){
            if(player._id === $scope.id){
                $scope.player = player;
                if($scope.player.name === $rootScope.login){
                    $scope.edit = true;
                }
            }
        });
    }

    var error = function(msg){
        $rootScope.alerts.push(msg);
    }
    getArray('players', $http, success, error);

    $scope.submit = function() {
        console.log("posting data ...");

        var data = {database: 'players', doc: $scope.player};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response, status){
            $scope.alerts.push({ type:"success", msg: " Saved"});
        });

        promise.error(function(response, status){
            $scope.alerts.push({ type:"danger",
                msg: "Request failed with response '" + response + "' and status code: " + status});
        });
    };
}]);

boxleagueApp.controller('playersCtrl', ['$scope', '$log', '$http' ,'$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("playersCtrl");

    var success = function(players){
        $rootScope.players = players;
    }
    var error = function(msg){
        $rootScope.alerts.push(msg);
    }
    if(!$rootScope.players){
        getArray('players', $http, success, error);
    }

    $scope.sortType     = 'name'; // set the default sort type
    $scope.sortReverse  = false;  // set the default sort order
    $scope.searchName   = '';     // set the default search/filter term
}]);

function getDayClass(data) {
    var date = data.date,
        mode = data.mode;
    if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i = 0; i < $scope.events.length; i++) {
            var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

            if (dayToCheck === currentDay) {
                return $scope.events[i].status;
            }
        }
    }

    return '';
}

boxleagueApp.controller('importBoxleagueCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importBoxleagueCtrl");

    var success = function(players){
        $rootScope.players = players;
    }
    var error = function(msg){
        $rootScope.alerts.push(msg);
    }
    if(!$rootScope.players){
        getArray('players', $http, success, error);
    }

    $scope.changeEvent = "";
    $scope.filename = "";
    $scope.boxleague = $rootScope.boxleague;
    if($scope.boxleague){
        $scope.boxes = $scope.boxleague.boxes;
    }

    // For Dates
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(2016, 1, 1),
        startingDay: 1
    };

    $scope.startPopUp = {
        opened: false
    };

    $scope.openStartPopUp = function() {
        $scope.startPopUp.opened = true;
    };

    $scope.endPopUp = {
        opened: false
    };

    $scope.openEndPopUp = function() {
        $scope.endPopUp.opened = true;
    };

    var findPlayer = function(name){
        for(var i=0; i<$rootScope.players.length; i++){
            if(name === $rootScope.players[i].name){
                return($rootScope.players[i])
            };
        };
        // TBD - this should be a throw as we have a missing player
        //throw "Couldn't find player: " + name;
        // replace the return with throw
        return {name:name, _id: "unknown"};
    };

    var findBox = function(name){
        for(var i=0; i<$rootScope.boxes.length; i++){
            if(name === $rootScope.boxes[i].name){
                return($rootScope.boxes[i])
            };
        };
        throw "Couldn't find box: " + name;
    };

    var findGameIds = function(games, name){
        var ids = [];
        games.forEach(function(game){
            if(game.box === name){
                ids.push(game._id);
            }
        });
        if(ids.length === 0){
            throw "Couldn't find games in box: " + boxName;
        }
        return ids;
    };

    $scope.submit = function() {
        console.log("posting boxleague data ...");

        // save the boxleague first and obtain its _id reference
        var boxleague = {name: $scope.boxleagueName, start: $scope.startDate, end: $scope.endDate}

        var data = {database: 'boxleagues', doc: boxleague};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response, status){
            $scope.alerts.push({ type:"success", msg: "#1 Saved initial boxleague"});
            boxleague._id = response.id;
            boxleague._rev = response.rev;

            // iterate over the boxes and extract the games
            // fill out the game details including boxleague and box name
            var games = [];
            $scope.boxes.forEach(function(box){
                box.games.forEach(function(game){
                    // add the additional references
                    game.boxleague = boxleague.name;
                    game.boxleagueId = boxleague._id;
                    game.box = box.name;
                    games.push(game);
                });
            });

            // join games with their player ids
            games.forEach(function(game){
                game.homeId = findPlayer(game.home)._id;
                game.awayId = findPlayer(game.away)._id;
            });

            var data = {database: 'games', data: games};
            var promise = $http.post('submitDocs', JSON.stringify(data));

            promise.success(function(response, status){
                $scope.alerts.push({ type:"success", msg: "#2 Saved boxleague games"});
                for(var i=0;i<response.length;i++){
                    games[i]._id = response[i].id;
                }

                // create a new list of box objects containing players, player ids and game ids
                var boxes = [];
                $scope.boxleague.boxes.forEach(function(box){
                    var ids = [];
                    box.players.forEach(function(player){
                        ids.push(findPlayer(player)._id);
                    });
                    boxes.push({name: box.name, players: box.players, playerIds: ids, games: findGameIds(games, box.name)});
                });

                // now save the boxleague for the second time with the boxes containing players and games
                boxleague.boxes = boxes;
                var data = {database: 'boxleagues', doc: boxleague};
                var promise = $http.post('submitDoc', JSON.stringify(data));

                promise.success(function(response, status){
                    $scope.alerts.push({ type:"success", msg: "#3 Saved boxleague boxes"});
                });

                promise.error(function(response, status){
                    $scope.alerts.push({ type:"danger",
                        msg: "Saving boxleage with boxes request failed with response '" + response + "' and status code: " + status});
                });
            });

            promise.error(function(response, status){
                $scope.alerts.push({ type:"danger",
                    msg: "Saving games request failed with response '" + response + "' and status code: " + status});
            });
        });

        promise.error(function(response, status){
            $scope.alerts.push({ type:"danger",
                msg: "Saving initial boxleague request failed with response '" + response + "' and status code: " + status});
        });

//        var boxleague = {name: $scope.name, start: $scope.startDate, end: $scope.endDate, boxes: $scope.boxes}

//        var data = {database: 'games', data: games};
//        var promise = $http.post('submitDocs', JSON.stringify(data));
//
//        promise.success(function(response, status){
//            $scope.alerts.push({ type:"success", msg: " Saved"});
//        });
//
//        promise.error(function(response, status){
//            $scope.alerts.push({ type:"danger",
//                msg: "Request failed with response '" + response + "' and status code: " + status});
//        });

//        var boxleague = {name: $scope.name, start: $scope.startDate, end: $scope.endDate, boxes: $scope.boxes}
//        var promise = $http.post('submitNewBoxleague', JSON.stringify(boxleague));
//
//        promise.success(function(response, status){
//            $scope.alerts.push({type:"success", msg: "Boxes Saved"});
//        });
//
//        promise.error(function(response, status){
//            $scope.alerts.push({type:"danger",
//                msg: "Request failed with response '" + response + "' and status code: " + status});
//        });
    };

    $scope.$watch('changeEvent', function(){
        if(!$scope.changeEvent){
            return
        };

        $scope.filename = $scope.changeEvent.target.files[0].name;

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});
                $scope.boxes = [];
                $rootScope.boxleague = { boxes:[], boxName: "Import" };

                workbook.SheetNames.forEach(function(boxName){
                    if(boxName.indexOf("Box ") === -1){
                        return;
                    };

                    var content = XLSX.utils.sheet_to_csv( workbook.Sheets[boxName]);

                    var games = [];
                    var matches = content.match(/([a-zA-Z' ]*),v.,([a-zA-Z' ]*)/g);
                    matches.forEach( function(pairing){
                        var players = pairing.split(",v.,");
                        var game = {home: findPlayer(players[0]).name, away: findPlayer(players[1]).name, score: ""};
                        games.push(game);
                    });

                    // parse out the week information and use the date and time to create the game time
                    var weeks = [];
                    matches = content.match(/(Week \d,\d*\/\d*\/\d*,\d*.\d*)/g);
                    matches.forEach( function(weekItem){
                        var details = weekItem.split(",");
                        var weekNum = details[0].replace("Week ", "");
                        var week = {week: weekNum, date: details[1], time: details[2].replace('.',':')};
                        weeks.push(week);
                    });

                    // hardcoded for now
                    for(var i=0;i<6;i++){
                        games[i].schedule = new Date(weeks[i%2].date + " " + weeks[i%2].time);
                    }
                    for(var i=6;i<12;i++){
                        games[i].schedule = new Date(weeks[i%2+2].date + " " + weeks[i%2+2].time);
                    }
                    for(var i=12;i<15;i++){
                        games[i].schedule = new Date(weeks[4].date + " " + weeks[4].time);
                    }
                    games.sort(function(a,b){
                        //return a.week.week.replace("Week ","") - b.week.week.replace("Week ","");
                        return a.schedule - b.schedule;
                    });

                    var players = {};
                    games.forEach(function(game){
                        players[game.home] = true;
                        players[game.away] = true;
                    });
                    players = Object.keys(players).map(function (key) {return key});
                    players.sort();

                    var box = {name: boxName, games: games, players: players};
                    $scope.boxes.push(box);
                    $rootScope.boxleague.boxes = $scope.boxes;
                });
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);


boxleagueApp.controller('importPlayersCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersCtrl");

    $scope.changeEvent = "";
    $scope.filename = "";

    var currentPlayers = [];
    $rootScope.players.forEach(function(player){
        currentPlayers.push(player)
    });

    $scope.submit = function() {
        console.log("posting player data ...");

        // clean data
        var data = [];
        $scope.newPlayers.forEach(function(player){
            data.push({name: player.name, mobile: player.mobile, home: player.home, email: player.email});
        })

        var promise = $http.post('submitNewPlayers', JSON.stringify(data));

        promise.success(function(response, status){
            $rootScope.alerts.push({ type:"success", msg: "Players Saved"});
        });

        promise.error(function(response, status){
            $rootScope.alerts.push({ type:"danger",
                msg: "Request failed with response '" + response + "' and status code: " + status});
        });
    };

    $scope.$watch('changeEvent', function(){
        if(!$scope.changeEvent){
            return
        };

        $scope.filename = $scope.changeEvent.target.files[0].name;

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});

                $scope.newPlayers = [];

                var content = XLSX.utils.sheet_to_csv( workbook.Sheets["Numbers"]);

                var matches = content.match(/([a-zA-Z' ]*),([0-9\\ ]*)/g);
                matches.forEach( function(item){
                    var details = item.split(',');
                    // skip if missing content
                    if(details[0].length === 0 || details[1].length === 0){
                        return
                    }
                    var name = details[0];
                    var mobile = details[1];
                    var player = {name: name, mobile: mobile};

                    if(currentPlayers.indexOf(name) === -1){
                        $scope.newPlayers.push(player);
                    }
                });
            });
        };
        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);

boxleagueApp.controller('boxesCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("boxesCtrl");

    var error = function(msg){
        $rootScope.alerts.push(msg);
    }

    var successLoadPlayers = function(players){
        $rootScope.players = players;
    }
    if(!$rootScope.players){
        getArray('players', $http, successLoadPlayers, error);
    }

    var successLoadBoxleague = function(boxleagues){
        $rootScope.boxleague = boxleagues;
    }
    if(!$rootScope.boxleague){
        getObject('boxleagues', $http, successLoadBoxleague, error);
    }
}]);

boxleagueApp.controller('boxCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$q',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http, $q) {
    $log.info("boxCtrl");

    var promises = [];
    var error = function(msg){
        $rootScope.alerts.push(msg);
    }

    var successLoadPlayers = function(players){
        $rootScope.players = players;
    }
    if(!$rootScope.players){
        promises.push(getArray('players', $http, successLoadPlayers, error));
    }

    var successLoadBoxleague = function(boxleagues){
        $rootScope.boxleague = boxleagues;
    }
    if(!$rootScope.boxleague){
        promises.push(getObject('boxleagues', $http, successLoadBoxleague, error));
    }

    var successLoadGames = function(games){
        $rootScope.games = games;
    }
    if(!$rootScope.games){
        promises.push(getArray('games', $http, successLoadGames, error));
    }

    $scope.save = function(id){
        console.log('submit game ' + id);

        var game = findGameById($scope.games, id);
        // the copy we save can only be items in scope for the database
        var copy = {};
        var scope = ['_id', '_rev', 'home', 'away', 'score', 'schedule',
                     'boxleague', 'boxleagueId', 'box', 'homeId', 'awayId'];
        scope.forEach(function(key){
            copy[key] = game[key];
        });

        var data = {database: 'games', doc: copy};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response, status){
            //$scope.alerts.push({ type:"success", msg: "Saved game"});
            game._rev = response.rev;
            game.save = false;
        });

        promise.error(function(response, status){
            $scope.alerts.push({ type:"danger",
                msg: "Saving game request failed with response '" + response + "' and status code: " + status});
        });
    }

    $scope.login = $rootScope.login;
    $scope.search = "";
    $scope.boxName = $routeParams.box;

    $q.all(promises).then(function(){
        var box = findBoxByName($rootScope.boxleague.boxes, $scope.boxName);
        var players = lookupPlayers(box.playerIds);
        var games = lookupGames(box.games);

        setUp(box, players, games);
     });

    function findGameById(source, id){
        for (var i = 0; i < source.length; i++) {
            if (source[i]._id === id) {
                return source[i];
            }
        }
        throw "Couldn't find object with id: " + id;
    }

    function findBoxByName(source, name){
        for (var i = 0; i < source.length; i++) {
            if (source[i].name === name) {
                return source[i];
            }
        }
        throw "Couldn't find object with name: " + name;
    }

    function findGameByPlayers(games, player1, player2){
        for (var i = 0; i < games.length; i++) {
            if((games[i].homeId === player1._id && games[i].awayId === player2._id) ||
               (games[i].homeId === player2._id && games[i].awayId === player1._id)){
                return(games[i]);
            }
        }
      throw "findGameByPlayers couldn't find game with player1: " + player1._id + " and player2: " + player2._id;
    }

    function lookupPlayers(ids){
        results = [];
        ids.forEach(function(id){
            $rootScope.players.forEach(function(player){
                if(player._id === id){
                    results.push(player)
                }
            });
        });
        return results;
    }

    function lookupGames(ids){
        results = [];
        ids.forEach(function(id){
            $rootScope.games.forEach(function(game){
                if(game._id === id){
                    results.push(game)
                }
            });
        });
        return results;
    }

    function setUp(box, players, games){

        $scope.tableHeaders = [];
        $scope.tableRows = [];
        $scope.tableHeaders.push(box.name);

        $scope.games = games;
        $scope.players = players;

        players.forEach(function(player1){
            var row = [];
            row.push(player1.name);
            $scope.tableRows.push(row);
            $scope.tableHeaders.push(player1.name);

            players.forEach(function(player2){
                try {
                    var game = findGameByPlayers(games, player1, player2);
                    row.push({game: game, home: player1.name, away: player2.name});
                }
                catch(err){
                    row.push("");
                }
            })
        });
    }

    $scope.fixtureFilter = function (item) {
        return $scope.search.length === 0 | item.home.indexOf($scope.search) >= 0 || item.away.indexOf($scope.search) >=0 ;
    };

    function reverse(score){
        var sets = score.split(" ");
        var text = "";
        sets.forEach(function(item){
            var games = item.split(":");
            var game1 = games[1] || "";
            var game0 = games[0] || "";
            text += game1;
            if( game0.length ){
                text += ":" + game0;
            }
            text += " ";
        })
        return text;
    }

    $scope.getText = function(column, row, index){
        switch( typeof column ){
            case 'string':
                return column;
            case 'object':
                break;
            default:
                return column;
        };

        if(row[index].game.home === row[index].home){
            return row[index].game.score;
        } else {
            return reverse(row[index].game.score);
        }
    };

    // do we have valid values for a home:away set
    function isSetScore(score) {
        var games = score.split(":");

        if(games.length !== 2){
            return 0;
        }

        home = parseInt(games[0]);
        away = parseInt(games[1]);

        // score is not set
        if (home + away === 0){
            return 0;
        }

        // score is not set
        if (home < 6 && away < 6){
            return 0;
        }

        // values are not in range
        if (home < 0 || away < 0){
            return 0;
        }

        // tie break set
        if (home === 7 && (away === 6 || away === 5)) {
            return 1;
        }

        // tie break set
        if (away === 7 && (home === 6 || home === 5)) {
            return 1;
        }

        // valid scores
        var ctbdiff = Math.abs(home - away);
        if (home === 6 && ctbdiff >= 2){
            return 1;
        } else if (away === 6 && ctbdiff >= 2){
            return 1;
        }

        return 0;
    }

    // do we have valid values for a home:away tiebreak
    function isTiebreakScore(score) {
        var games = score.split(":");

        if(games.length !== 2){
            return 0;
        }

        home = parseInt(games[0]);
        away = parseInt(games[1]);

        // score is not set
        if (home + away === 0){
            return 0;
        }

        // valid scores e.g. 1:0
        if((home === 1 && away === 0) || (home === 0 && away === 1)){
            return 1;
        }

        // score is not set
        if (home < 10 && away < 10){
            return 0;
        }

        // values are not in range
        if (home < 0 || away < 0){
            return 0;
        }

        var ctbdiff = Math.abs(home - away);
        if (home === 10 && ctbdiff >= 2){
            return 1;
        } else if (away === 10 && ctbdiff >= 2){
            return 1;
        }
        if (home > 10 && ctbdiff === 2){
            return 1;
        } else if (away > 10 && ctbdiff === 2){
            return 1;
        }

        return 0;
    }

    // Do we have valid text in the sets score set1 set2 set3
    function isSetsScore(score) {
        if(score === "W:0" || score === "0:W"){
            return 1;
        }

        if(score === "w:0" || score === "0:w"){
            return 1;
        }

        var sets = score.split(" ");
        if(sets.length === 2 && isSetScore(sets[0]) && isSetScore(sets[1])){
            return 1;
        }
        if(sets.length === 3 && isSetScore(sets[0]) && isSetScore(sets[1]) && isSetScore(sets[2])){
            return 1;
        }
        if(sets.length === 3 && isSetScore(sets[0]) && isSetScore(sets[1]) && isTiebreakScore(sets[2])){
            return 1;
        }

        return 0;
    }

    // Has someone won correctly
    function isCompleteScore(score) {
        if(score === "W:0" || score === "0:W"){
            return 1;
        }

        if(score === "w:0" || score === "0:w"){
            return 1;
        }

        var sets = score.split(" ");
        var home = 0;
        var away = 0;

        sets.forEach(function(set){
            var games = set.split(":");
            if(parseInt(games[0]) > parseInt(games[1])){
                home++;
            };
            if(parseInt(games[0]) < parseInt(games[1])){
                away++;
            };
        });

        if(home === 2 && (away === 1 || away === 0 )){
            return 1;
        }
        if(away === 2 && (home === 1 || home === 0 )){
            return 1;
        }
        return 0;
    }

    $scope.validInput = /^([W]:[0])|([0]:[W])|[0-9]+:[0-9]+ [0-9]+:[0-9]+ [0-9]+:[0-9]+|[0-9]+:[0-9]+ [0-9]+:[0-9]+$/;

    $scope.inputScore = function(game){
        game.error = "";
        game.save = false;

        game.score = game.score.replace(/[\-.;,]/g,":");
        game.score = game.score.replace(/::/g,":");
        game.score = game.score.replace(/  /g," ");
        game.score = game.score.replace(/[^W: \d]/g,"");
        game.score = game.score.substring(0,13);

        if(!game.score){
            // if the game score is blanked out
            game.save = true;
            return;
        }

        var validStr = $scope.validInput.test(game.score);
        if(!validStr){
            game.error = "?";
            return;
        }

        var validSetsScore = isSetsScore(game.score);
        if(!validSetsScore) {
            game.error = "!";
            return;
        }

        var validCompleteScore = isCompleteScore(game.score);
        if(!validCompleteScore) {
            game.error = "*";
            return;
        }

        if(validStr && validSetsScore && validCompleteScore && game.score !== game.origScore ){
            game.save = true;
        }
    };
}]);