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

boxleagueApp.controller('welcomeCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("welcomeCtrl");

    // reset on the welcome screen only
    //$rootScope.alerts = [];
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

    $scope.submit = function() {
        console.log("posting boxleague data ...");

        // save the boxleague
        var boxleague = {name: $scope.boxleagueName, start: $scope.startDate, end: $scope.endDate};

        var data = {database: 'boxleagues', doc: boxleague};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function(response){
            $rootScope.alerts.push({ type:"success", msg: "#1 Saved initial boxleague"});

            boxleague._id = response.id;
            boxleague._rev = response.rev;

            // create a new list of game objects containing player ids
            var games = [];
            $rootScope.games.forEach(function(game){
                var clone = {};

                // add the player references
                clone.homeId = findByName($rootScope.players, game.home)._id;
                clone.home = game.home;
                clone.awayId = findByName($rootScope.players, game.away)._id;
                clone.away = game.away;

                // add the boxleague references
                clone.boxleague = boxleague.name;
                clone.boxleagueId = boxleague._id;

                // add the box name
                clone.name = game.name;

                // add the scheduled play date
                clone.schedule = game.schedule;

                games.push(clone);
            });

            var data = {database: 'games', data: games};
            var promise = $http.post('submitDocs', JSON.stringify(data));

            promise.success(function(response){
                $rootScope.alerts.push({ type:"success", msg: "#2 Saved boxleague games"});

                for(var i=0;i<response.length;i++){
                    games[i]._id = response[i].id;
                }

                // create a new list of box objects containing player and game ids
                var boxes = [];
                $rootScope.boxleague.boxes.forEach(function(box){
                    var ids = [];
                    box.players.forEach(function(player){
                        ids.push(findByName($rootScope.players, player)._id);
                    });
                    boxes.push({name: box.name, playerIds: ids, gameIds: findMatchingNames(games, box.name)});
                });

                // now save the boxleague for the second time with the boxes containing players and games
                boxleague.boxes = boxes;

                var data = {database: 'boxleagues', doc: boxleague};
                var promise = $http.post('submitDoc', JSON.stringify(data));

                promise.success(function(response, status){
                    $rootScope.alerts.push({ type:"success", msg: "#3 Saved boxleague boxes"});
                });

                promise.error(function(response, status){
                    $rootScope.alerts.push({ type:"danger",
                        msg: "Saving boxleage with boxes request failed with response '" + response + "' and status code: " + status});
                });
            });

            promise.error(function(response, status){
                $rootScope.alerts.push({ type:"danger",
                    msg: "Saving games request failed with response '" + response + "' and status code: " + status});
            });
        });

        promise.error(function(response, status){
            $rootScope.alerts.push({ type:"danger",
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
        $rootScope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});

                $rootScope.boxleague = {boxName: "Import", boxes: []};
                var idCount = 0; // temport ids for games

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

                        var game = {
                            // temp id
                            _id: idCount++,

                            // players
                            homeId: findByName($rootScope.players, players[0])._id,
                            home: players[0],
                            awayId: findByName($rootScope.players, players[1])._id,
                            away: players[1],

                            // boxleague
                            boxleague: $rootScope.boxleague.name,
                            boxleagueId: $rootScope.boxleague._id,

                            // box
                            name: boxName
                        };

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

                    var players = {};
                    games.forEach(function(game){
                        players[game.home] = true;
                        players[game.away] = true;
                    });
                    players = Object.keys(players).map(function (key) {return key});
                    players.sort();

                    var ids = [];
                    players.forEach(function(player){
                        ids.push(findByName($rootScope.players, player)._id);
                    });

                    var box = {name: boxName, games: games, players: players, playerIds: ids, games: findMatchingNames(games, boxName)};
                    //$scope.boxes.push(box);
                    //$rootScope.boxleague.boxes = $scope.boxes;
                    $rootScope.boxleague.boxes.push(box);
                });
                $scope.boxleague = $rootScope.boxleague;
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);


boxleagueApp.controller('importPlayersCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersCtrl");

    $scope.changeEvent = "";
    $scope.filename = "";
    $scope.currentPlayers = [];

    var success = function(players){
        $rootScope.players = players;

        $rootScope.players.forEach(function(player){
            $scope.currentPlayers.push(player)
        });
    }
    var error = function(msg){
        $rootScope.alerts.push(msg);
    }
    if(!$rootScope.players){
        getArray('players', $http, success, error);
    }

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

//    var error = function(msg){
//        $rootScope.alerts.push(msg);
//    }
//
//    var successLoadPlayers = function(players){
//        $rootScope.players = players;
//    }
//    if(!$rootScope.players){
//        getArray('players', $http, successLoadPlayers, error);
//    }
//
//    var successLoadBoxleague = function(boxleagues){
//        $rootScope.boxleague = boxleagues;
//    }
//    if(!$rootScope.boxleague){
//        getObject('boxleagues', $http, successLoadBoxleague, error);
//    }

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

var findMatchingNames = function(source, name){
    var ids = [];
    source.forEach(function(item){
        if(item.name === name){
            ids.push(item._id);
        }
    });
    if(ids.length === 0){
        throw "Couldn't find item with name: " + name;
    }
    return ids;
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
    for (var i = 0; i < source.length; i++) {
        if (source[i].name === name) {
            return source[i];
        }
    }
    throw "Couldn't find object with name: " + name;
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