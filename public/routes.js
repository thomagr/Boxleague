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

    when('/admin', {
        templateUrl: 'pages/admin.html',
        controller: 'adminCtrl',
        controllerAs: 'vm'
    }).

    when('/boxleague', {
        templateUrl: './box.html',
        controller: 'boxCtrl'
    }).

    otherwise({
        redirectTo: '/'
    });

}]);
