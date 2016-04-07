// CONTROLLERS

boxleagueApp.controller('forcastCtrl', ['$scope', '$log', '$resource', '$routeParams', '$http', '$timeout', function ($scope, $log, $resource, $routeParams, $http, $timeout) {
    $log.info("forcastCtrl");

    $scope.location = $routeParams.location;
    $scope.days = '5';
    $scope.hours = '4';
    $scope.appId = 'dfa92a2daab9476f51718353645f1c85'

//    $scope.dailyWeatherAPI = $resource("http://api.openweathermap.org/data/2.5/forecast/daily", { callback: "JSON_CALLBACK" }, { get: { method: "JSONP" }});
//    $scope.hourlyWeatherAPI = $resource("http://api.openweathermap.org/data/2.5/forecast", { callback: "JSON_CALLBACK" }, { get: { method: "JSONP" }});
//
//    $scope.dailyWeatherAPI.get({ q: $scope.location, cnt: $scope.days, appid: $scope.appId }, function(data){
//            $scope.dailyWeatherResult = data;
//        }).$promise.then( function( data){
//        return $scope.hourlyWeatherAPI.get({ id: $scope.dailyWeatherResult.city.id, cnt: $scope.hours, appid: $scope.appId }, function(data){
//            $scope.hourlyWeatherResult = data;
//        });
//    });

    $scope.convertToDegC = function(degK) {
        return Math.round(degK - 273.15);
    };

    $scope.convertToDate = function(dt) {
        return new Date(dt * 1000);
    };

    $timeout(function(){
    var hourlyPromise = $http.get('/weatherHourly?location=' + $scope.location);
    hourlyPromise.success(function(response, status) {
        $scope.hourlyWeatherResult = response;
    });
    hourlyPromise.error(function(response, status) {
        error({
            type: "danger",
            msg: "Request failed with response '" + response + "' and status code: " + status
        })
    });
    }, 1000);

    $timeout(function(){
    var dailyPromise = $http.get('/weatherDaily?location=' + $scope.location);
    dailyPromise.success(function(response, status) {
        $scope.dailyWeatherResult = response;
    });
    dailyPromise.error(function(response, status) {
        error({
            type: "danger",
            msg: "Request failed with response '" + response + "' and status code: " + status
        })
    });
    }, 2000);

}]);

boxleagueApp.controller('welcomeCtrl', ['$scope', '$rootScope', '$log', function ($scope, $rootScope, $log) {
    $log.info("welcomeCtrl");

    $rootScope.alerts = [];
}]);

boxleagueApp.controller('myBoxCtrl', ['$scope', '$rootScope', '$log', '$location', function ($scope, $rootScope, $log, $location) {
    $log.info("myBoxCtrl");

    $rootScope.alerts = [];
    $rootScope.init().then(function(){
        $rootScope.boxleague.boxes.forEach(function(box){
            if(box.players.map(function(item){return item.name}).indexOf($rootScope.login) !== -1){
                 $location.url('/box/' + box.name );
            }
        })
    })
}]);

boxleagueApp.controller('settingsCtrl', ['$scope', '$log', '$http', '$rootScope', '$location', function ($scope, $log, $http, $rootScope, $location) {
    $log.info("settingsCtrl");

    var changeLocation = function(){
        $location.url('/player/' + findByName($rootScope.players, $rootScope.login)._id );
    };

    var success = function(players){
        $rootScope.players = players;
        changeLocation();
    };
    var error = function(msg){
        $rootScope.alerts.push(msg);
    };
    if(!$rootScope.players){
        getArray('players', $http, success, error);
    } else {
        changeLocation();
    }
}]);

boxleagueApp.controller('playerCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("playerCtrl");

    $scope.id = $routeParams.id;

    $rootScope.init().then(function(){
        $rootScope.players.forEach(function(player){
            if(player._id === $scope.id){
                $scope.player = player;
                if($scope.player.name === $rootScope.login){
                    $scope.edit = true;
                }
            }
        });
    });

//    var success = function(players){
//        $rootScope.players = players;
//        players.forEach(function(player){
//            if(player._id === $scope.id){
//                $scope.player = player;
//                if($scope.player.name === $rootScope.login){
//                    $scope.edit = true;
//                }
//            }
//        });
//    }
//
//    var error = function(msg){
//        $rootScope.alerts.push(msg);
//    }
//    getArray('players', $http, success, error);

    $scope.submit = function() {
        console.log("posting data ...");

        // clone the player
        var player = {};
        player.name = $scope.player.name;
        player.mobile = $scope.player.mobile;
        player.home = $scope.player.home;
        player.email = $scope.player.email;
        player._id = $scope.player._id;
        player._rev = $scope.player._rev;

        var data = {database: 'players', doc: player};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response){
            $rootScope.alerts.push({type:"success", msg: " Saved"});
        });

        promise.error(function(response){
            $rootScope.alerts.push({type:"danger",
                msg: "Save failed with error '" + response + "'. Refreshing page, please check and try again." });
            $rootScope.init();
        });
    };
}]);

boxleagueApp.controller('playersCtrl', ['$scope', '$log', '$http' ,'$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("playersCtrl");

//    var success = function(players){
//        $rootScope.players = players;
//    }
//    var error = function(msg){
//        $rootScope.alerts.push(msg);
//    }
//    if(!$rootScope.players){
//        getArray('players', $http, success, error);
//    }
//    $rootScope.init().then(function(){
//        $scope.players = $rootScope.players;
//    });
    $rootScope.init();
    //$rootScope.players = [{name: "graham", _id:1},{name: "graham", _id:1}];

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

function check(object, type){
    switch(type){
        case "array":
            if(!object instanceof Array){
                throw "object is not of type " + type;
            }
            break;
        case "Date":
            if(!object instanceof Date){
                throw "object is not of type " + type;
            }
            break;
        default:
            if(typeof object !== type){
                    throw "object is not of type " + type;
            }
    }
}

function createBoxleague(id, name, start, end, boxes){

    check(id, "string");
    check(name, "string");
    check(start, "Date");
    check(end, "Date");
    check(boxes, "array");

    return {
        _id: id,

        name:  name,

        // dates
        start: start,
        end:   end,

        // boxes
        boxes: boxes
    }
}

function createGame(id, homeId, homeDetails, awayId, awayDetails, boxleagueName, boxleagueId, boxName){

    check(id, "string");
    check(homeId, "string");
    check(homeDetails, "object");
    check(homeDetails.name, "string");
    check(awayId, "string");
    check(awayDetails, "object");
    check(awayDetails.name, "string");
    check(boxleagueName, "string");
    check(boxleagueId, "string");
    check(boxName, "string");

    return {
        _id: id,

        // players
        homeId: homeId,
        home:   homeDetails,
        awayId: awayId,
        away:   awayDetails,

        // boxleague
        boxleague:   boxleagueName,
        boxleagueId: boxleagueId,

        // box
        box: boxName
    }
}

boxleagueApp.controller('importBoxleagueCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importBoxleagueCtrl");

    $rootScope.init().then(function(){
        if($rootScope.boxleague){
            $scope.boxleagueName = $rootScope.boxleague.name;
            $scope.startDate = $rootScope.boxleague.start;
            $scope.endDate = $rootScope.boxleague.end;
        }
    });

    $scope.changeEvent = "";
    $scope.filename = "";

    // For Dates dialog
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
        startingDay: 1,
        initDate: new Date
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
    // end for Dates dialog

    $scope.reset = function(){
        delete $rootScope.games;
        delete $rootScope.boxleague;
        delete $scope.boxleagueName;
        $scope.startDate = new Date;
        $scope.endDate = new Date;
    }

    $scope.submit = function(){
        var boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        $rootScope.saveImportedBoxleague(boxleague, $rootScope.games, $rootScope.players);
    }

    $scope.$watch('changeEvent', function(){
        if(!$scope.changeEvent){
            return
        };

        $scope.filename = $scope.changeEvent.target.files[0].name;
        $rootScope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});

                // add some default values is not provided
                $scope.boxleagueName = $scope.boxleagueName || "Import";
                $scope.startDate = $scope.startDate || new Date;
                $scope.endDate = $scope.endDate || new Date;

                $rootScope.boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, []);
                var idCount = 0; // temp ids for games

                workbook.SheetNames.forEach(function(boxName){

                    if(boxName.indexOf("Box ") === -1){
                        return;
                    };

                    var games = []; // games on this sheet

                    var content = XLSX.utils.sheet_to_csv( workbook.Sheets[boxName]);

                    var matches = content.match(/([a-zA-Z' ]*),v.,([a-zA-Z' ]*)/g);
                    matches.forEach( function(pairing){
                        var players = pairing.split(",v.,");

                        // player fix
                        if(players[0] === "Anthony Dore") { players[0] = "Antony Dore"};
                        if(players[1] === "Anthony Dore") { players[1] = "Antony Dore"};

                        var game = createGame(idCount.toString(),
                            findByName($rootScope.players, players[0])._id,
                            findByName($rootScope.players, players[0]),
                            findByName($rootScope.players, players[1])._id,
                            findByName($rootScope.players, players[1]),
                            $rootScope.boxleague.name,
                            $rootScope.boxleague._id,
                            boxName);

                        idCount++;
                        $rootScope.games.push(game);
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

                    var playerNames = {};
                    games.forEach(function(game){
                        playerNames[game.home.name] = true;
                        playerNames[game.away.name] = true;
                    });
                    playerNames = Object.keys(playerNames).map(function (key) {return key});
                    playerNames.sort();

                    var ids = [];
                    var players = [];
                    playerNames.forEach(function(player){
                        ids.push(findByName($rootScope.players, player)._id);
                        players.push(findByName($rootScope.players, player));
                    });

                    var box = {name: boxName, games: games, players: players, playerIds: ids, gameIds: findIdsMatchingName(games, boxName)};
                    //$scope.boxes.push(box);
                    //$rootScope.boxleague.boxes = $scope.boxes;
                    $rootScope.boxleague.boxes.push(box);
                });
                //$scope.boxleague = $rootScope.boxleague;
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);

boxleagueApp.controller('importBoxleagueFileCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importBoxleagueFileCtrl");

    $rootScope.init().then(function(){
        if($rootScope.boxleague){
            $scope.boxleagueName = $rootScope.boxleague.name;
            $scope.startDate = $rootScope.boxleague.start;
            $scope.endDate = $rootScope.boxleague.end;
        } else {
            $scope.boxleagueName = "Import";
            $scope.startDate = new Date;
            $scope.endDate = new Date;
        }
    });

    $scope.changeEvent = "";
    $scope.filename = "";

    // For Dates dialog
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
        startingDay: 1,
        initDate: new Date
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
    // end for Dates dialog

    $scope.reset = function(){
        delete $rootScope.games;
        delete $rootScope.boxleague;
        delete $scope.boxleagueName;
        $scope.startDate = new Date;
        $scope.endDate = new Date;
    }

    var findPlayersInBox = function(source, box){
        var players = [];
        source.forEach(function(item){
            if(item.box === box){
                players.push(item.name);
            }
        });
        if(players.length === 0){
            throw "Couldn't find players in box: " + box;
        }
        return players;
    };

    $scope.submit = function(){
        var boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        $rootScope.saveImportedBoxleague(boxleague, $rootScope.games, $rootScope.players);
    }

    $scope.$watch('changeEvent', function(){
        if(!$scope.changeEvent){
            return
        };

        $scope.filename = $scope.changeEvent.target.files[0].name;
        $rootScope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;

                // add some default values is not provided
                $scope.boxleagueName = $scope.boxleagueName || "Import";
                $scope.startDate = $scope.startDate || new Date;
                $scope.endDate = $scope.endDate || new Date;

                $rootScope.boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, []);

                var playersAndBox = [];
                var boxNames = [];
                var lines = data.split('\n');
                lines.forEach(function(line){
                    if(!line || line.length === 0) {
                        return;
                    }
                    var items = line.split(",");
                    playersAndBox.push({name: items[0], box: items[1]});
                    if(boxNames.indexOf(items[1]) === -1){
                        boxNames.push(items[1]);
                    }
                });

                var idCount = 0; // temp id for games
                var games = [];
                boxNames.forEach(function(boxName){
                    var boxPlayers = findPlayersInBox(playersAndBox, boxName);

                    if(boxPlayers.length !== 6){
                        throw "Box " + name + " does not have the correct number of players";
                    }

                    // build the list of games from the players
                    for(var i=0;i<6;i++){
                        for(var j=i+1;j<6;j++){
                            var game = createGame(idCount.toString(),
                                findByName($rootScope.players, boxPlayers[i])._id,
                                findByName($rootScope.players, boxPlayers[i]),
                                findByName($rootScope.players, boxPlayers[j])._id,
                                findByName($rootScope.players, boxPlayers[j]),
                                $rootScope.boxleague.name,
                                $rootScope.boxleague._id,
                                boxName);

                            idCount++;
                            games.push(game);
                        }
                    }
                });

                // check if a play exists already in the array of games
                var findPlayer = function(games, player){
                    for(var i=0;i<games.length;i++){
                        if(games[i].home === player || games[i].away === player){
                            return true;
                        }
                    }
                    return false;
                }

                // create size distinct(players) game sets
                var findDistinct = function(games, size){
                    var start = 0;
                    var results = [];
                    while(results.length !== size && start < games.length - 1){
                        results = []; // reset
                        results.push(games[start++]);
                        for(var i=0;i<games.length;i++){
                            if(!findPlayer(results, games[i].home) && !findPlayer(results, games[i].away)){
                                results.push(games[i]);
                                if(results.length === size){
                                    return results;
                                }
                            }
                        }
                    }
                    throw "Could not find distinct games"
                }

                // return the difference between these arrays (what's left)
                var difference = function(a1, a2) {
                    var result = [];
                    var map = a2.map(function(item){return item._id});
                    for (var i = 0; i < a1.length; i++) {
                        if (map.indexOf(a1[i]._id) === -1) {
                            result.push(a1[i]);
                        }
                    }
                    return result;
                }

                boxNames.forEach(function(boxName){
                    var boxGames = findObjectsMatchingName(games, boxName);

                    // create 5 weeks of games of 3 games per week
                    var date = new Date($scope.startDate);
                    var toBePlayed = boxGames;
                    var newGames = [];
                    for(var i=0;i<5;i++)
                    {
                        var tmp = findDistinct(toBePlayed, 3);
                        toBePlayed = difference(toBePlayed, tmp);
                        tmp.forEach(function(game){
                            game.schedule = new Date(date);
                            newGames.push(game);
                        });
                        date.setDate(date.getDate() + 7);
                    }
                    boxGames = newGames;

                    var playerNames = [];
                    boxGames.forEach(function(game){
                        if(playerNames.indexOf(game.home.name) === -1){
                            playerNames.push(game.home.name);
                        }
                        if(playerNames.indexOf(game.away.name) === -1){
                            playerNames.push(game.away.name);
                        }
                    });

                    var boxPlayers = [];
                    playerNames.forEach(function(player){
                        boxPlayers.push(findByName($rootScope.players, player));
                    });

                    var box = {
                        name: boxName,
                        players: boxPlayers,
                        playerIds: boxPlayers.map(function(item){return item._id}),
                        games: boxGames,
                        gameIds: boxGames.map(function(item){return item._id})
                        };

                    $rootScope.boxleague.boxes.push(box);
                });
                $rootScope.games = games;
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);

boxleagueApp.controller('importPlayersFileCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersFileCtrl");

    $scope.changeEvent = "";
    $scope.filename = "";

    $rootScope.init().then(function(){
        $scope.currentPlayers = $rootScope.players;
    });

    $scope.submit = function() {
        $rootScope.saveNewPlayers($scope.newPlayers);
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

                $scope.newPlayers = [];

                var line = data.split('\n');
                line.forEach( function(item){
                    var details = item.split(',');
                    // skip if missing name
                    if(details[0].length === 0 ){
                        return
                    }
                    var name = details[0];
                    var mobile = details[1];
                    var home = details[2];
                    var email = details[3];

                    var player = {name: name, mobile: mobile, home: home, email: email};

                    var currentMap = $scope.currentPlayers.map(function(x){return x.name});
                    var newMap = $scope.newPlayers.map(function(x){return x.name});

                    if(currentMap.indexOf(name) === -1 && newMap.indexOf(name) === -1){
                        $scope.newPlayers.push(player);
                    }
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

    $rootScope.init().then(function(){
        $scope.currentPlayers = $rootScope.players;
    });

    $scope.submit = function() {
        $rootScope.saveNewPlayers($scope.newPlayers);
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

                    var currentMap = $scope.currentPlayers.map(function(x){return x.name});
                    var newMap = $scope.newPlayers.map(function(x){return x.name});

                    if(currentMap.indexOf(name) === -1 && newMap.indexOf(name) === -1){
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

    $rootScope.init();

    // sort order, if we have boxes use the box number
    $scope.sortElement = function(item){
        if(item.name.indexOf("Box ") !== -1){
            return parseInt(item.name.replace("Box ", ""));
        } else {
            return item.name;
        }
    }
}]);

boxleagueApp.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, game) {

  $scope.score = game.score;
  $scope.home = game.home;
  $scope.away = game.away;

  $scope.reset = function(){
      $scope.score = "";
      load();
  }

  // load
  load = function(){
      $scope.sets = [];

      // initialise
      [1,2,3].forEach(function(set){
          $scope.sets.push({name:"Set " + set, game1:"0", game2:"0"});
      });

      var sets = $scope.score ? $scope.score.split(" ") : [];
      var i=0;
      for(var i=0;i<sets.length;i++){
          var set = sets[i];
          var games = set.split(":");
          var game1 = games[0] || "0";
          var game2 = games[1] || "0";
          $scope.sets[i].game1 = game1;
          $scope.sets[i].game2 = game2;
      };
  };

  setsToScore = function(sets){
      var score = "";
      sets.forEach(function(set){
          score += set.game1 + ":" + set.game2 + " ";
      });
      score = score.trim();
      score = score.replace(/ 0:0$/, "");
      return score;
  }

  $scope.notValidScore = function(){
      var score = "";

      score = setsToScore($scope.sets);

      var validSetsScore = isSetsScore(score);
      var validCompleteScore = isCompleteScore(score);

      return !(validSetsScore && validCompleteScore);
  }

  load();

  $scope.decrement = function(score){
      var num = parseInt(score);
      num = Math.max(0, num-1);

      return num.toString();
  }

  $scope.increment = function(score, index){
      var num = parseInt(score);
      var max = index === 2 ? 99 : 7;
      num = Math.min(max, num+1);

      return num.toString();
  }

  $scope.ok = function () {
      game.score = cleanScore(setsToScore($scope.sets));
      $uibModalInstance.close(game);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss(null);
  };
});

cleanScore = function(score){
    if(!score){
        return score;
    }

    // games shouldn't have 0:0 or unwanted strings
    score = score.replace(/0:0/g, "");
    score = score.replace(/  /g, " ");
    score = score.trim();

    return score;
}

var findObjectsMatchingName = function(source, name){
    var results = [];
    source.forEach(function(item){
        if(item.box === name){
            results.push(item);
        }
    });
    if(results.length === 0){
        throw "Couldn't find item with name: " + name;
    }
    return results;
};

var findIdsMatchingName = function(source, name){
    return findObjectsMatchingName(source,name).map(function(item){return item._id});
};

function findById(source, id){
    for (var i = 0; i < source.length; i++) {
        if (source[i]._id === id) {
            return source[i];
        }
    }
    throw "Couldn't find object with id: " + id;
}

function findByName(source, name){
    if(!source){
        throw "No source provided";
    }

    if(!name){
        throw "No name provided";
    }

    for (var i = 0; i < source.length; i++) {
        if (source[i].name === name) {
            return source[i];
        }
    }
    throw "Couldn't find object with name: " + JSON.stringify(name);
}

boxleagueApp.controller('boxCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$q', '$uibModal',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http, $q, $uibModal) {
    $log.info("boxCtrl");

    // modal pop-up
    $scope.openByGrid = function(column, row, index){
        // if the colum is not a score column then return
        switch( typeof column ){
            case 'string':
                return;
            case 'object':
                break;
            default:
                return;
        };

        // if the row login is not the logged in person ignore
        if(row[index].home != $rootScope.login && row[index].away != $rootScope.login){
          return;
        }
//
//        var score;
//        if(row[index].game.home === row[index].home){
//            score = row[index].game.score;
//        } else {
//            score = reverse(row[index].game.score);
//        }

        open(row[index].game);
    };

    // modal pop-up
    $scope.openByFixture = function (game) {
        // if the row login is not the logged in person ignore
        if(game.home != $rootScope.login && game.away != $rootScope.login){
          return;
        }

        open(game);
    };

    $scope.readOnly = function(column, row, index) {
        //console.log(JSON.stringify(row[index]));

        if(index === 0){
            return true;
        }
        if(row[index].home === "Free Week"){
            return true;
        }
        if(row[index].away === "Free Week"){
            return true;
        }
        if(row[index].home === $rootScope.login){
            return false;
        }
        if(row[index].away === $rootScope.login){
            return false;
        }
        return true;
    };

    open = function (game) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            resolve: {
                game: function () {
                    return game;
                }
            }
        });

        modalInstance.result.then(function(game){
            if(!game){
                return;
            };

            $scope.save(game._id);
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };
    // end pop-up

//    var promises = [];
//    var error = function(msg){
//        $rootScope.alerts.push(msg);
//    }
//
//    var successLoadPlayers = function(players){
//        $rootScope.players = players;
//    }
//    if(!$rootScope.players){
//        promises.push(getArray('players', $http, successLoadPlayers, error));
//    }
//
//    var successLoadBoxleague = function(boxleagues){
//        $rootScope.boxleague = boxleagues;
//    }
//    if(!$rootScope.boxleague){
//        promises.push(getObject('boxleagues', $http, successLoadBoxleague, error));
//    }
//
//    var successLoadGames = function(games){
//        $rootScope.games = games;
//    }
//    if(!$rootScope.games){
//        promises.push(getArray('games', $http, successLoadGames, error));
//    }

    $scope.save = function(id){
        console.log('submit game ' + id);

        var game = findById($scope.games, id);
        // the copy we save can only be items in scope for the database
        var copy = {};
        var scope = ['_id', '_rev', 'home', 'away', 'score', 'schedule',
                     'boxleague', 'boxleagueId', 'box', 'homeId', 'awayId'];
        scope.forEach(function(key){
            copy[key] = game[key];
        });

        game.score = cleanScore(game.score);

        var data = {database: 'games', doc: copy};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response){
            game._rev = response.rev;
            game.save = false;
            $rootScope.alerts.push({type:"success", msg: " Saved"});
        });

        promise.error(function(response){
            $rootScope.alerts.push({ type:"danger",
                msg: "Save failed with error '" + response + "'. Refreshing page, please check and try again." });
            delete $rootScope.games;
            $rootScope.init().then(function(){
                setUpBox();
            });
        });
    }

    var setUpBox = function(){
        //$scope.login = $rootScope.login;
        $scope.search = "";
        $scope.boxName = $routeParams.box;

        $scope.box = findByName($rootScope.boxleague.boxes, $scope.boxName);
        $scope.boxPlayers = $scope.box.players;//lookupPlayers(box.playerIds);
        $scope.boxGames = $scope.box.games;//lookupGames(box.games);

        $scope.tableHeaders = [];
        $scope.tableRows = [];
        $scope.tableHeaders.push($scope.box.name);

//        $scope.games.forEach(function(game){
//            game.score = cleanScore(game.score);
//        });
//
//        $scope.games = games;
//        $scope.players = players;

        $scope.boxPlayers.forEach(function(player1){
            var row = [];
            row.push(player1.name);
            $scope.tableRows.push(row);
            $scope.tableHeaders.push(player1.name);

            $scope.boxPlayers.forEach(function(player2){
                try {
                    var game = findGameByPlayers($scope.boxGames, player1, player2);
                    row.push({game: game, home: player1.name, away: player2.name});
                }
                catch(err){
                    row.push("");
                }
            })
        });
    }

    $rootScope.init().then(function(){
        setUpBox();
    });

//    $q.all(promises).then(function(){
//        refresh();
//    });

    function findGameByPlayers(games, player1, player2){
        for (var i = 0; i < games.length; i++) {
            if((games[i].homeId === player1._id && games[i].awayId === player2._id) ||
               (games[i].homeId === player2._id && games[i].awayId === player1._id)){
                return(games[i]);
            }
        }
      throw "findGameByPlayers couldn't find game with player1: " + player1._id + " and player2: " + player2._id;
    }

//    function lookupPlayers(ids){
//        results = [];
//        ids.forEach(function(id){
//            $rootScope.players.forEach(function(player){
//                if(player._id === id){
//                    results.push(player)
//                }
//            });
//        });
//        return results;
//    }
//
//    function lookupGames(ids){
//        results = [];
//        ids.forEach(function(id){
//            $rootScope.games.forEach(function(game){
//                if(game._id === id){
//                    results.push(game)
//                }
//            });
//        });
//        return results;
//    }

    $scope.fixtureFilter = function (item) {
        return $scope.search.length === 0 | item.home.name.indexOf($scope.search) >= 0 || item.away.name.indexOf($scope.search) >=0 ;
    };

    function reverse(score){
        if(!score){
            return "";
        }
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

    $scope.getCellScore = function(column, row, index){
        switch( typeof column ){
            case 'string':
                if(!column.length){
                    return "x";
                } else {
                    return column;
                }
            case 'object':
                break;
            default:
                return "?";
        };

        var cell;
        if(row[index].game.home.name === row[index].home){
            cell = row[index].game.score;
        } else {
            cell = reverse(row[index].game.score);
        }
        //console.log('cell %s', cell)
        switch(cell){
            case null:
                return "null";
            //case "":
            //    return row[index].home === $rootScope.login ? "0:0" : "";
            default:
                return cell;
        }
    };

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

// global functions
// Has someone won correctly
function isCompleteScore(score) {
    if(score === "W:0" || score === "0:W"){
        return 1;
    }

    if(score === "w:0" || score === "0:w"){
        return 1;
    }

    if(score === "0:0 0:0"){
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

    var diff = Math.abs(home - away);
    if (home === 10 && home - away >= 2){
        return 1;
    } else if (away === 10 && away - home >= 2){
        return 1;
    } else if (home > 10 && diff === 2){
        return 1;
    } else if (away > 10 && diff === 2){
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

    if(score === "0:0 0:0"){
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
// Do we have a valid set score
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

    // values are not in range
    if (home > 7 || away > 7){
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
    if (home === 6 && home - away >= 2){
        return 1;
    } else if (away === 6 && away - home >= 2){
        return 1;
    }

    return 0;
}