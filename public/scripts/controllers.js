// CONTROLLERS
var login = "Graham Thomas";

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

boxleagueApp.controller('dropDownCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    $log.info("dropDownCtrl");

    $scope.items = [
        "The first choice!",
        "And another choice for you.",
        "but wait! A third!"
    ];
}]);

boxleagueApp.controller('welcomeCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    $log.info("welcomeCtrl");

    $scope.close = function(index) {
        $scope.alerts.splice(index, 1);
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
    getPlayers($http, success, error);

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
        console.log("posting boxleague data....");

        var boxleague = { name: $scope.name, start: $scope.startDate, end: $scope.endDate, boxes: $scope.boxes }
        var promise = $http.post('submitNewBoxleague', JSON.stringify(boxleague));

        promise.success(function(response, status){
            $scope.alerts.push({ type:"success", msg: "Boxes Saved"});
        });

        promise.error(function(response, status){
            $scope.alerts.push({ type:"danger",
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
                        var game = {home: players[0], away: players[1], score: "", origScore: ""};
                        games.push(game);
                    });

                    var weeks = [];
                    matches = content.match(/(Week \d,\d*\/\d*\/\d*,\d*.\d*)/g);
                    matches.forEach( function(weekItem){
                        var details = weekItem.split(",");
                        var weekNum = details[0].replace("Week ", "");
                        var week = {week: weekNum, date: details[1], time: details[2]};
                        weeks.push(week);
                    });

                    // hardcoded for now
                    for(var i=0;i<6;i++){
                        games[i].week = weeks[i%2];
                    }
                    for(var i=6;i<12;i++){
                        games[i].week = weeks[i%2+2];
                    }
                    for(var i=12;i<15;i++){
                        games[i].week = weeks[4];
                    }
                    games.sort(function(a,b){
                        return a.week.week.replace("Week ","") - b.week.week.replace("Week ","");
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

    var success = function(players){
        $rootScope.players = players;
        players.forEach(function(player){
            currentPlayers.push(player.name);
        });
    }

    var error = function(msg){
        $rootScope.alerts.push(msg);
    }
    getPlayers($http, success, error);

    $scope.submit = function() {
        console.log("posting player data....");

        var promise = $http.post('submitNewPlayers', JSON.stringify($scope.players));

        promise.success(function(response, status){
            $scope.alerts.push({ type:"success", msg: "Players Saved"});
        });

        promise.error(function(response, status){
            $scope.alerts.push({ type:"danger",
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
                    var name = details[0].split(' ');
                    var first = name[0];
                    var last = name.splice(1, name.length-1).join(' ');
                    name = first + ' ' + last;
                    var mobile = details[1];
                    var player = {first: first, last: last, name: name, mobile: mobile};

                    if(currentPlayers.indexOf(name) === -1){
                        $scope.newPlayers.push(player);
                    }
                });
            });
        };
        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);

boxleagueApp.controller('boxCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http',
    function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("boxCtrl");

    $scope.login = login;
    $scope.search = "";

    $scope.boxName = $routeParams.box;

    var error = function(msg){
        $rootScope.alerts.push(msg);
    }

    var successPlayers = function(players){
        $scope.players = players;
        $rootScope.players = players;

        setUp();
    }

    var successBoxleague = function(boxleague){
        $scope.boxleague = boxleague;
        $rootScope.boxleague = boxleague;

        if($rootScope.players){
            successPlayers($rootScope.players);
        } else {
            getPlayers($http, successPlayers, error);
        }
    }

    if($rootScope.boxleague){
        successBoxleague($rootScope.boxleague);
    } else {
        getBoxleague($http, successBoxleague, error);
    }

    function findBoxByName(source, name) {
        for (var i = 0; i < source.length; i++) {
            if (source[i].name === name) {
                return source[i];
            }
        }
        throw "Couldn't find object with name: " + name;
    }

    function findGameByPlayers(source, player1, player2) {
        for (var i = 0; i < source.length; i++) {
            if((source[i].home === player1 && source[i].away === player2) ||
               (source[i].home === player2 && source[i].away === player1)){
                return(source[i]);
            }
        }
      throw "Couldn't find object with player1: " + player1 + " and player2: " + player2;
    }

    function lookupPlayers(players) {
        results = [];
        players.forEach(function(lookup){
            $rootScope.players.forEach(function(player){
                if(player.first + " " + player.last === lookup){
                    results.push(player)
                }
            });
        });
        return results;
    }

    function setUp(){
        if( !$scope.boxleague || !$scope.boxleague.boxes || !$scope.boxName )
            throw "boxleague, boxleague.boxes or boxName not specified";

        $scope.box = findBoxByName($scope.boxleague.boxes, $scope.boxName);

        var players = $scope.box.players;
        $scope.players = lookupPlayers(players);

        $scope.tableHeaders = [];
        $scope.tableRows = [];
        $scope.tableHeaders.push($scope.boxName);

        players.forEach(function(player1){
            var row = [];
            row.push(player1);
            $scope.tableRows.push(row);

            $scope.tableHeaders.push(player1);

            players.forEach(function(player2){
                try {
                    var game = findGameByPlayers($scope.box.games, player1, player2);
                    row.push({game: game, home: player1, away: player2});
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