boxleagueApp.config(["$routeProvider", "$locationProvider", "$httpProvider", function ($routeProvider, $locationProvider, $httpProvider) {
    //================================================
    // Check if the user is valid
    //================================================
    var checkLoggedin = function ($q, $timeout, $http, $location, $rootScope) {
        console.log("checkLoggedin");
        // Initialize a new promise
        var deferred = $q.defer();

        if (!$rootScope.isAuth) {
            // Make an AJAX call to get the login details
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
                    $rootScope.currentUrl = $location.url();
                    console.log("Redirecting original URL %s to /login", $location.url());
                    $location.url('/login');

                    deferred.reject();
                }
            });
        } else {
            deferred.resolve();
        }

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

    $httpProvider.interceptors.push(function($q, $rootScope, $timeout) {
        return {
            request: function(config) {
                $rootScope.requesting = $rootScope.requesting || 0;
                $rootScope.requesting++;
                console.log('Request: %s, %s, %s', config.method, $rootScope.requesting, config.url);
                $timeout(function() {
                    if ($rootScope.requesting > 0 && $rootScope.isAuth) {
                        $rootScope.loading = true;
                    }
                }, 500);
                return config;
            },

            response: function(response) {
                console.log('Response: %s, %s, %s', $rootScope.requesting, response.status, response.config.url);
                $rootScope.requesting--;
                if ($rootScope.requesting <= 0) {
                    $rootScope.loading = false;
                    $rootScope.requesting = 0;
                }
                return response;
            },

            responseError: function (response) {
                console.log('Response: %s, %s, %s', $rootScope.requesting, response.status, response.config.url);
                $rootScope.requesting--;
                if ($rootScope.requesting <= 0) {
                    $rootScope.loading = false;
                    $rootScope.requesting = 0;
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
    }).when('/logout', {
        templateUrl: 'pages/login.html',
        controller: 'logoutCtrl'
    }).when('/', {
        templateUrl: 'pages/welcome.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/password/:id', {
        templateUrl: 'pages/password.html',
        controller: 'passwordCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/forgotPassword', {
        templateUrl: 'pages/forgotPassword.html',
        controller: 'passwordCtrl'
    }).when('/rules', {
        templateUrl: 'pages/rules.html',
        controller: 'welcomeCtrl',
        resolve: {
            loggedin: checkLoggedin
        }
    }).when('/setsHelp', {
        templateUrl: 'pages/setsHelp.html',
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
        controller: 'boxleagueMainCtrl'//,
        // resolve: {
        //     loggedin: checkLoggedin
        // }
    }).when('/leaderboard', {
        templateUrl: 'pages/empty.html',
        controller: 'leaderboardMainCtrl'//,
        // resolve: {
        //     loggedin: checkLoggedin
        // }
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
    }).when('/nextBoxleague', {
        templateUrl: 'pages/nextBoxleague.html',
        controller: 'nextBoxleagueCtrl',
        resolve: {
            loggedin: checkLoggedin
        }        
    }).when('/myBox', {
        controller: 'myBoxMainCtrl',
        templateUrl: 'pages/noBox.html'//,
        // resolve: {
        //     loggedin: checkLoggedin
        // }
    }).when('/settings', {
        templateUrl: 'pages/empty.html',
        controller: 'settingsMainCtrl'//,
        // resolve: {
        //     loggedin: checkLoggedin
        // }
    }).when('/headToHead', {
        templateUrl: 'pages/empty.html',
        controller: 'headToHeadMainCtrl'//,
        // resolve: {
        //     loggedin: checkLoggedin
        // }
    }).when('/headToHead/:id', {
        templateUrl: 'pages/headToHead.html',
        controller: 'headToHeadCtrl',
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
    }).when('/managePlayers', {
        templateUrl: 'pages/managePlayers.html',
        controller: 'managePlayersCtrl',
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
