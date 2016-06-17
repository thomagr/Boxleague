// MODULE
var boxleagueApp = angular.module('boxleagueApp', ['ngRoute', 'ngResource', 'ui.bootstrap']);

// ROUTES

boxleagueApp.run(function ($rootScope, $http, __env) {

    $rootScope.alerts = [];

    // returning a promise
    $rootScope.init = function () {
        var error = function (msg) {
            $rootScope.alerts.push(msg);
        };

        var successBoxleague = function (boxleagues) {
            //$rootScope.alerts.push({type: "success", msg: "loaded boxleague"});

            var boxleague = boxleagues[boxleagues.length - 1];

            // dereference all of the player and game ids
            boxleague.boxes.forEach(function (box, index, arr) {
                arr[index].players = [];
                box.playerIds.forEach(function (id) {
                    arr[index].players.push(findById($rootScope.players, id));
                });
                arr[index].games = [];
                box.gameIds.forEach(function (id) {
                    arr[index].games.push(findById($rootScope.games, id));
                });
            });
            $rootScope.boxleague = boxleague;
        };

        var successGames = function (response) {
            //$rootScope.alerts.push({type: "success", msg: "loaded games"});

            $rootScope.games = response.data;
            // dereference all of the player ids
            // $rootScope.games.forEach(function (game, index, arr) {
            //     arr[index].home = findById($rootScope.players, game.homeId);
            //     arr[index].away = findById($rootScope.players, game.awayId);
            // });
            return getArray('boxleagues', $http, successBoxleague, error)
        };

        var successPlayers = function (response) {
            //$rootScope.alerts.push({type: "success", msg: "loaded players"});

            $rootScope.players = response.data;
            return $http.get('/games').then(successGames, error);
        };

        if (!$rootScope.players || !$rootScope.games || !$rootScope.boxleague) {
            return $http.get('/players').then(successPlayers, error);
        } else {
            return promise.resolve("success");
        }
    };

    $rootScope.saveImportedBoxleague = function (boxleague, games, players) {
        console.log("posting boxleague data ...");

        // keep a copy of the boxes, we will add these back later after the id is created
        var boxes = boxleague.boxes;
        // create a new copy of the boxleague with the known data
        boxleague = createBoxleague("0", boxleague.name, boxleague.start, boxleague.end, []);
        // delete the id as this will be created by the database
        delete boxleague._id;

        var data = {database: 'boxleagues', doc: boxleague};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function (response) {
            $rootScope.alerts.push({type: "success", msg: "#1 Saved initial boxleague"});

            boxleague._id = response.id;
            boxleague._rev = response.rev;

            // create a clean list of games
            games.forEach(function (game, index, array) {
                array[index] = createGame("0", findById(players, game.homeId), findById(players, game.awayId), boxleague, game.box, game.schedule);
                delete array[index]._id;
            });

            var data = {database: 'games', data: games};
            var promise = $http.post('submitDocs', JSON.stringify(data));

            promise.success(function (response) {
                $rootScope.alerts.push({type: "success", msg: "#2 Saved boxleague games"});

                for (var i = 0; i < response.length; i++) {
                    games[i]._id = response[i].id;
                }

                // create a clean list of boxes but using the new games
                boxes.forEach(function (box, index, array) {
                    var boxPlayers = box.playerIds.map(function (item) {
                            return findById(players, item);
                        });
                    var boxGames = findObjectsMatchingBox(games, box.name);
                    array[index] = createBox(box.name, boxPlayers, boxGames);
                });

                // now save the boxleague for the second time with the boxes containing players and games
                boxleague.boxes = boxes;

                var data = {database: 'boxleagues', doc: boxleague};
                var promise = $http.post('submitDoc', JSON.stringify(data));

                promise.success(function (response, status) {
                    $rootScope.alerts.push({type: "success", msg: "#3 Saved boxleague boxes"});
                    $rootScope.boxleague = boxleague;
                    $rootScope.games = games;
                });

                promise.error(function (response, status) {
                    $rootScope.alerts.push({
                        type: "danger",
                        msg: "Saving boxleage with boxes request failed with response '" + response + "' and status code: " + status
                    });
                });
            });

            promise.error(function (response, status) {
                $rootScope.alerts.push({
                    type: "danger",
                    msg: "Saving games request failed with response '" + response + "' and status code: " + status
                });
            });
        });

        promise.error(function (response, status) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Saving initial boxleague request failed with response '" + response + "' and status code: " + status
            });
        });
    };

    // Logout function is available in any pages
    $rootScope.logout = function () {
        $rootScope.message = 'Logged out.';
        //$rootScope.isAuth = false;
        $http.post('/logout');
    };
});

function getArray(name, http, success, error) {
    console.log('getArray /service?name=' + name);

    var promise = http.get('/service?name=' + name);

    promise.success(function (response, status) {
        if (response.rows && response.rows.length) {
            var arr = [];
            response.rows.forEach(function (item) {
                arr.push(item.doc);
            });
            success(arr);
        } else {
            error({type: "warning", msg: "No " + name + " found"});
        }
    });

    promise.error(function (response, status) {
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

    promise.success(function (response, status) {
        if (response.rows && response.rows.length) {
            success(response.rows[0].doc);
        } else {
            error({type: "warning", msg: "No " + name + " found"});
        }
    });

    promise.error(function (response, status) {
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
boxleagueApp.controller('mainCtrl', function ($scope, $rootScope, $http, $location, __env) {

    $rootScope.production = __env.production;

    var error = function () {
        $rootScope.alerts.push({
            type: "danger",
            msg: "The username or password entered is incorrect."
        });
    };

    $scope.login = function () {
        $http.post('/login', {username: $scope.username, password: $scope.password}).then(function (response) {
            $rootScope.login = response.data.name;
            $rootScope.alerts = [];
            if ($rootScope.login === "Admin") {
                $location.url('/');
            } else {
                $location.url('/myBox');
            }
        }, error);
    };

    // required for message alerts
    $rootScope.close = function (index) {
        $rootScope.alerts.splice(index, 1);
    };
});