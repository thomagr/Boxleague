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

    when('/forcast/:location', {
        templateUrl: 'pages/forcast.html',
        controller: 'forcastCtrl'
    }).

    when('/import', {
        templateUrl: 'pages/import.html',
        controller: 'importCtrl'
    }).

    when('/boxes', {
        templateUrl: 'pages/boxes.html',
        controller: 'boxesCtrl'
    }).

    when('/rules', {
        templateUrl: 'pages/rules.html',
        controller: 'welcomeCtrl'
    }).

    when('/box/:box', {
        templateUrl: 'pages/box.html',
        controller: 'boxCtrl'
    }).

    otherwise({
        redirectTo: '/'
    });

}]);
