// MODULE
var boxleagueApp = angular.module('boxleagueApp', ['ngRoute', 'ngResource', 'ui.bootstrap']);


// ROUTES
boxleagueApp.config(["$routeProvider", "$locationProvider", "$httpProvider", function($routeProvider, $locationProvider, $httpProvider) {
    //================================================
    // Check if the user is connected
    //================================================
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
      // Initialize a new promise
      var deferred = $q.defer();

      // Make an AJAX call to check if the user is logged in
      $http.get('/loggedin').success(function(user){
        // Authenticated
        if (user !== '0')
          /*$timeout(deferred.resolve, 0);*/
          deferred.resolve();

        // Not Authenticated
        else {
          $rootScope.message = 'You need to log in.';
          //$timeout(function(){deferred.reject();}, 0);
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
          // do something on success
          $rootScope.isAuth = true;
          return response;
        },
        responseError: function(response) {
          if (response.status === 401){
            $location.url('/login');
            $rootScope.isAuth = false;
            return $q.reject(response);
          }
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

    when('/forcast/:location', {
        templateUrl: 'pages/forcast.html',
        controller: 'forcastCtrl',
        resolve: {
          loggedin: checkLoggedin
        }
    }).

    when('/import', {
        templateUrl: 'pages/import.html',
        controller: 'importCtrl',
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

}]);

boxleagueApp.run(function($rootScope, $http){
    $rootScope.message = '';

    // Logout function is available in any pages
    $rootScope.logout = function(){
      $rootScope.message = 'Logged out.';
      $rootScope.isAuth = false;
      $http.post('/logout');
    };
});

function convertDocsToPlayers(response){
    var players = [];
    response.rows.forEach(function(item){
        players.push({
            name: item.doc.first_name + ' ' + item.doc.last_name,
            first: item.doc.first_name,
            last: item.doc.last_name,
            mobile: item.doc.mobile,
            home: item.doc.home,
            email: item.doc.email
        });
    });
    return players;
};

function getPlayers($scope, http){

    if( $scope.players && $scope.players.length ){
        return;
    }

    var promise = http.get('/service?name=players');

    promise.success(function(response, status){
        $scope.players = convertDocsToPlayers(response);
    });

    promise.error(function(response, status){
        $scope.alerts = $scope.alerts || [];
        $scope.alerts.push({ type:"danger",
            msg: "Request failed with response '" + response + "' and status code: " + status});
    });
}

function getBoxleagues($scope, http){

    if( $scope.boxleague ){
        return;
    }

    var promise = http.get('/service?name=boxleagues');

    promise.success(function(response, status){
        if(response.rows && response.rows.length){
            $scope.boxleague = response.rows[0].doc;
        }
    });

    promise.error(function(response, status){
        $scope.alerts = $scope.alerts || [];
        $scope.alerts.push({ type:"danger",
            msg: "Request failed with response '" + response + "' and status code: " + status});
    });
}

/**********************************************************************
 * Login controller
 **********************************************************************/
boxleagueApp.controller('mainCtrl', function($scope, $rootScope, $http, $location) {
  // This object will be filled by the form
  $scope.user = {};

  $rootScope.alerts = [];
  $rootScope.close = function(index) {
      $rootScope.alerts.splice(index, 1);
  };

  getBoxleagues($rootScope, $http);
  getPlayers($rootScope, $http);

  $rootScope.isAuth = false;

  // Register the login() function
  $scope.login = function(){
    $http.post('/login', {
      username: $scope.user.username,
      password: $scope.user.password,
    })
    .success(function(user){
      // No error: authentication OK
      $rootScope.isAuth = true;
      $location.url('/');
    })
    .error(function(){
      // Error: authentication failed
      $rootScope.isAuth = false;
      $location.url('/login');
    });
  };
});