// MODULE
var boxleagueApp = angular.module('boxleagueApp', ['ngRoute', 'ngResource', 'ui.bootstrap']);

// ROUTES
boxleagueApp.config(["$routeProvider", "$locationProvider", "$httpProvider", function($routeProvider, $locationProvider, $httpProvider) {
    //================================================
    // Check if the user is connected
    //================================================
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope) {
        // Initialize a new promise
        var deferred = $q.defer();

        // Make an AJAX call to check if the user is logged in
        $http.get('/loggedin').success(function(response) {
            // Authenticated
            if (response !== '0') {
                $rootScope.isAuth = true;
                $rootScope.login = response.name;
                $rootScope.admin = $rootScope.login === 'Graham Thomas';
                deferred.resolve();
            }
            // Not Authenticated
            else {
//                $rootScope.alerts.push({
//                    type: "danger",
//                    msg: "Please log in"
//                });
                $rootScope.isAuth = false;
                deferred.reject();
                $location.url('/login');
            }
        });

        return deferred.promise;
    };
    //================================================

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function($q, $location, $rootScope) {
        return {
            response: function(response) {
                //$rootScope.isAuth = true;
                return response;
            },
            responseError: function(response) {
                if (response.status === 401) {
                    $location.url('/login');
                    $rootScope.isAuth = false;
                    return $q.reject(response);
                }
                return $q.reject(response);
            }
        };
    });
    //================================================

    //================================================
    // Define all the routes
    //================================================
    $routeProvider.
    when('/', {
        templateUrl: 'pages/welcome.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'mainCtrl'
    }).

    when('/players', {
        templateUrl: 'pages/players.html',
        controller: 'playersCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/settings', {
        templateUrl: 'pages/player.html',
        controller: 'settingsCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/player/:id', {
        templateUrl: 'pages/player.html',
        controller: 'playerCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/forcast/:location', {
        templateUrl: 'pages/forcast.html',
        controller: 'forcastCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/importPlayers', {
        templateUrl: 'pages/importPlayers.html',
        controller: 'importPlayersCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/importBoxleague', {
        templateUrl: 'pages/importBoxleague.html',
        controller: 'importBoxleagueCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/boxes', {
        templateUrl: 'pages/boxes.html',
        controller: 'boxesCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/rules', {
        templateUrl: 'pages/rules.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    when('/box/:box', {
        templateUrl: 'pages/box.html',
        controller: 'boxCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).

    otherwise({
        redirectTo: '/'
    });
    //================================================

}]);

boxleagueApp.run(function($rootScope, $http, $q) {

      $rootScope.alerts = [];

      // returning a promise
      $rootScope.init = function(){
            var error = function(msg){
                $rootScope.alerts.push(msg);
            }

            var successBoxleague = function(boxleague){
                //$rootScope.alerts.push({type: "success", msg: "loaded boxleague"});

                // dereference all of the player and game ids
                boxleague.boxes.forEach(function(box, index, arr){
                    arr[index].players = [];
                    box.playerIds.forEach(function(id){
                        arr[index].players.push(findById($rootScope.players, id));
                    });
                    arr[index].games = [];
                    box.gameIds.forEach(function(id){
                        arr[index].games.push(findById($rootScope.games, id));
                    });
                });
                $rootScope.boxleague = boxleague;
            }

            var successGames = function(games){
                //$rootScope.alerts.push({type: "success", msg: "loaded games"});

                // dereference all of the player ids
                games.forEach(function(game, index, arr){
                    arr[index].home = findById($rootScope.players, game.homeId);
                    arr[index].away = findById($rootScope.players, game.awayId);
                });
                $rootScope.games = games;
            }

            var successPlayers = function(players){
                //$rootScope.alerts.push({type: "success", msg: "loaded players"});

//                players.forEach(function(player){
//                    console.log(JSON.stringify(player));
//                })
                // check all players are unique
//                var arr = players.map(function(player){return player.name});
//                var sorted_arr = arr.slice().sort();
//                for (var i = 0; i < arr.length - 1; i++) {
//                    console.log(sorted_arr[i]);
//                    if (sorted_arr[i + 1] == sorted_arr[i]) {
//                        results.push(sorted_arr[i]);
//                        $rootScope.alerts.push({type: "danger", msg: "Duplicate player " + sorted_arr[i]})
//                    }
//                }

                $rootScope.players = players;
            }

            if(!$rootScope.players || !$rootScope.games || !$rootScope.boxleague){
                return getArray('players', $http, successPlayers, error)
                    .then(function(){
                        return getArray('games', $http, successGames, error)
                    })
                    .then(function(){
                        return getObject('boxleagues', $http, successBoxleague, error)
                    });
            } else {
                return Promise.resolve("success");
            }
    };

    // Logout function is available in any pages
    $rootScope.logout = function() {
        $rootScope.message = 'Logged out.';
        //$rootScope.isAuth = false;
        $http.post('/logout');
    };
});

function getArray(name, http, success, error) {
    console.log('getArray /service?name=' + name);

    var promise = http.get('/service?name=' + name);

    promise.success(function(response, status) {
        if (response.rows && response.rows.length) {
            var arr = [];
            response.rows.forEach(function(item) {
                arr.push(item.doc);
            });
            success(arr);
        } else {
            error({type: "warning", msg: "No " + name + " found"});
        }
    });

    promise.error(function(response, status) {
        error({
            type: "danger",
            msg: "Request failed with response '" + response + "' and status code: " + status
        })
    });

    return promise;
}

function getObject(name, http, success, error) {
    console.log('getObject /service?name=' + name);

    var promise = http.get('/service?name=' + name);

    promise.success(function(response, status) {
        if (response.rows && response.rows.length) {
            success(response.rows[0].doc);
        } else {
            error({type: "warning", msg: "No " + name + " found"});
        }
    });

    promise.error(function(response, status) {
        error({
            type: "danger",
            msg: "Request failed with response '" + response + "' and status code: " + status
        })
    });

    return promise;
}

/**********************************************************************
 * Login controller
 **********************************************************************/
boxleagueApp.controller('mainCtrl', function($scope, $rootScope, $http, $location) {
    $scope.user = {};

    //$rootScope.alerts = [];

    $rootScope.close = function(index) {
        $rootScope.alerts.splice(index, 1);
    };

    //$rootScope.isAuth = false;

    // Register the login() function
    $scope.login = function() {
        if(!$scope.username || !$scope.password){
            return;
        }

        var promise = $http.post('/login', {
            username: $scope.username,
            password: $scope.password,
        });

        promise.success(function(response) {
            //$rootScope.isAuth = true;
            $rootScope.login = response.name;
            $location.url('/');
            boxleagueApp.run();
        });

        promise.error(function(response, status) {
            //$rootScope.isAuth = false;
            var msg = {
                type: "danger",
                msg: "The username or password entered is incorrect."
            }
            $rootScope.alerts.push(msg);
            $location.url('/login');
        });
    };
});