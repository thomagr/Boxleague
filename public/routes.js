// ROUTES
boxleagueApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.

    when('/', {
        templateUrl: 'pages/welcome.html',
        controller: 'welcomeCtrl'
    }).

    when('/players', {
        templateUrl: 'pages/players.html',
        controller: 'playersCtrl'
    }).

    when('/forcast', {
        templateUrl: 'pages/forcast.html',
        controller: 'forcastCtrl'
    }).

    when('/import', {
        templateUrl: 'pages/import.html',
        controller: 'importCtrl'
    }).

    when('/boxleague', {
        templateUrl: './box.html',
        controller: 'boxCtrl'
    }).

    otherwise({
        redirectTo: '/'
    });

}]);
