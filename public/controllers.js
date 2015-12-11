// CONTROLLERS
boxleagueApp.controller('forcastCtrl', ['$scope', '$log', '$resource', function ($scope, $log, $resource) {
    $log.info("welcome");

    $scope.city = "Saint Albans, England";
    $scope.days = '5';
    $scope.appId = 'dfa92a2daab9476f51718353645f1c85'
    $scope.weatherAPI = $resource("http://api.openweathermap.org/data/2.5/forecast/daily", { callback: "JSON_CALLBACK" }, { get: { method: "JSONP" }});

    $scope.weatherResult = $scope.weatherAPI.get({ q: $scope.city, cnt: $scope.days, appid: $scope.appId });

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
        $log.debug(data);

        $scope.players      = data;
        $scope.sortType     = 'name'; // set the default sort type
        $scope.sortReverse  = false;  // set the default sort order
        $scope.searchName   = '';     // set the default search/filter term
    });
}]);

boxleagueApp.controller('adminCtrl', ['$scope', function ($scope) {
    var vm = this;

    vm.gridOptions = {};

    vm.reset = reset;

    function reset() {
        vm.gridOptions.data = [];
        vm.gridOptions.columnDefs = [];
        $scope.players = [];
    };

    $scope.importPlayers = function() {

        var players = [];
        vm.gridOptions.data.forEach( function(row){
            var first, last;
            var name = row.Name.split(" ");
            if( name.length === 2){
                first = name[0];
                last = name[1];
            } else {
                last = row.Name;
            };

            var number = row.Number.split(" / ");

            var mobile, home;
            if(number.length === 2){
                home = number[0];
                mobile = number[1];
            } else {
                if( row.Number[0] === '0' && row.Number[1] === '7' ){
                    mobile = row.Number;
                } else {
                    home = row.Number;
                }
            }

            player = { name : last + ', ' + first, mobile : mobile, home : home }
            players.push(player);
        });

        $scope.players = players;
    }
}]);