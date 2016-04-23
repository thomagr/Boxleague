boxleagueApp.config(["$routeProvider", "$locationProvider", "$httpProvider", function ($routeProvider, $locationProvider, $httpProvider) {
    //================================================
    // Check if the user is connected
    //================================================
    var checkLoggedin = function ($q, $timeout, $http, $location, $rootScope) {
        // Initialize a new promise
        var deferred = $q.defer();

        // Make an AJAX call to check if the user is logged in
        $http.get('/loggedin').success(function (response) {
            // Authenticated
            if (response !== '0') {
                $rootScope.isAuth = true;
                $rootScope.login = response.name;
                $rootScope.admin = $rootScope.login === 'Admin';
                deferred.resolve();
            }
            // Not Authenticated
            else {
                $rootScope.isAuth = false;
                deferred.reject();
                $location.url('/login');
            }
        });

        return deferred.promise;
    };

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function ($q, $location, $rootScope) {
        return {
            response: function (response) {
                return response;
            },
            responseError: function (response) {
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
    // Define all the routes
    //================================================
    $routeProvider.when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'mainCtrl'
    }).when('/', {
        templateUrl: 'pages/welcome.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/rules', {
        templateUrl: 'pages/rules.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/table/:name', {
        templateUrl: 'pages/table.html',
        controller: 'tableCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/form/:name/:id', {
        templateUrl: 'pages/form.html',
        controller: 'formCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/boxleague', {
        templateUrl: 'pages/empty.html',
        controller: 'boxleagueCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/leaderboard', {
        templateUrl: 'pages/empty.html',
        controller: 'leaderboardMainCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/boxleague/:id/boxes', {
        templateUrl: 'pages/boxes.html',
        controller: 'boxesCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/boxleague/:id/leaderboard', {
        templateUrl: 'pages/leaderboard.html',
        controller: 'leaderboardCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/boxleague/:id/box/:box', {
        templateUrl: 'pages/box.html',
        controller: 'boxCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/myBox', {
        controller: 'myBoxCtrl',
        templateUrl: 'pages/noBox.html',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/settings', {
        templateUrl: 'pages/empty.html',
        controller: 'settingsCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/importPlayersSpreadsheet', {
        templateUrl: 'pages/importPlayers.html',
        controller: 'importPlayersXlsCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/importPlayers', {
        templateUrl: 'pages/importPlayers.html',
        controller: 'importPlayersCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/importBoxleagueSpreadsheet', {
        templateUrl: 'pages/importBoxleague.html',
        controller: 'importBoxleagueCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/importBoxleagueFile', {
        templateUrl: 'pages/importBoxleague.html',
        controller: 'importBoxleagueFileCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/forcast/:location', {
        templateUrl: 'pages/forcast.html',
        controller: 'forcastCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).otherwise({
        redirectTo: '/'
    });
}]);
