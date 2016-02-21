// CONTROLLERS
boxleagueApp.controller('navBarCtrl', ['$scope', function ($scope) {
    $scope.isCollapsed = true;
}]);

boxleagueApp.controller('forcastCtrl', ['$scope', '$log', '$resource', '$routeParams', function ($scope, $log, $resource, $routeParams) {
    $log.info("welcome");

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

boxleagueApp.controller('welcomeCtrl', ['$scope', '$log', function ($scope, $log) {
    $log.info("welcome");
}]);

boxleagueApp.controller('playersCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    $log.info("players");

    $http.get('/players').success(function(data) {
        $scope.players      = data;
        $scope.sortType     = 'name'; // set the default sort type
        $scope.sortReverse  = false;  // set the default sort order
        $scope.searchName   = '';     // set the default search/filter term
    });
}]);

boxleagueApp.controller('importCtrl', ['$scope', '$log', function ($scope, $log) {
    $log.info("import");

    $scope.changeEvent = "";
    $scope.filename = "";
    $scope.boxes = [];

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

                workbook.SheetNames.forEach(function(boxName){
                    if(boxName.indexOf("Box ") === -1){
                        return;
                    };

                    var content = XLSX.utils.sheet_to_csv( workbook.Sheets[boxName]);

                    var games = [];
                    var matches = content.match(/([a-zA-Z' ]*),v.,([a-zA-Z' ]*)/g);
                    matches.forEach( function(pairing){
                        var players = pairing.split(",v.,");
                        var game = {home: players[0], away: players[1]};
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

                    var box = {name: boxName, games: games, players: players, template: "pages/boxTemplate.html"};
                    $scope.boxes.push(box);
                });
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);