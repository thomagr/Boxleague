// MODULE
var boxleagueApp = angular.module('boxleagueApp', ['ngRoute', 'ngResource', 'ui.bootstrap']);

// ROUTES

boxleagueApp.run(function ($rootScope, $http, $q) {

    $rootScope.alerts = [];

    // returning a promise
    $rootScope.init = function () {
        var error = function (msg) {
            $rootScope.alerts.push(msg);
        }

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
        }

        var successGames = function (response) {
            //$rootScope.alerts.push({type: "success", msg: "loaded games"});

            $rootScope.games = response.data;
            // dereference all of the player ids
            // $rootScope.games.forEach(function (game, index, arr) {
            //     arr[index].home = findById($rootScope.players, game.homeId);
            //     arr[index].away = findById($rootScope.players, game.awayId);
            // });
            return getArray('boxleagues', $http, successBoxleague, error)
        }

        var successPlayers = function (response) {
            //$rootScope.alerts.push({type: "success", msg: "loaded players"});

            $rootScope.players = response.data;
            return $http.get('/games').then(successGames, error);
        }

        if (!$rootScope.players || !$rootScope.games || !$rootScope.boxleague) {
            return $http.get('/players').then(successPlayers, error);
        } else {
            return Promise.resolve("success");
        }
    };

    $rootScope.saveImportedBoxleague = function (boxleague, games, players) {
        console.log("posting boxleague data ...");

        // delete the _id as the database will be creating this
        delete boxleague._id;
        delete boxleague["$$hashKey"];
        // delete the boxes as we will add these later in a controlled way
        var boxes = boxleague.boxes;
        delete boxleague.boxes;

        var data = {database: 'boxleagues', doc: boxleague};
        var promise = $http.post('submitDoc', JSON.stringify(data));

        promise.success(function (response) {
            $rootScope.alerts.push({type: "success", msg: "#1 Saved initial boxleague"});

            boxleague._id = response.id;
            boxleague._rev = response.rev;

            // delete the game _id as the database will be creating these
            // swap the player details for the player name
            // add the new boxleague details
            games.forEach(function (game, index, array) {
                delete array[index]._id;
                delete array[index]["$$hashKey"];
                array[index].home = game.home.name;
                array[index].away = game.away.name;
                array[index].boxleague = boxleague.name;
                array[index].boxleagueId = boxleague._id;
            });

            var data = {database: 'games', data: games};
            var promise = $http.post('submitDocs', JSON.stringify(data));

            promise.success(function (response) {
                $rootScope.alerts.push({type: "success", msg: "#2 Saved boxleague games"});

                for (var i = 0; i < response.length; i++) {
                    games[i]._id = response[i].id;
                }

                // updateDoc the boxes with game ids
                // swap the player details array for the player name
                // add the new boxleague name and id
                boxes.forEach(function (box, index, array) {
                    delete array[index].games;
                    delete array[index]["$$hashKey"];
                    array[index].gameIds = findIdsMatchingName(games, box.name);
                    array[index].players = box.players.map(function (item) {
                        return item.name
                    });
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

    $rootScope.saveNewPlayers = function (newPlayers) {
        console.log("posting new player data ...");

        // clean data
        var data = [];
        newPlayers.forEach(function (player) {
            data.push({name: player.name, mobile: player.mobile, home: player.home, email: player.email});
        })

        $http.post('/players', JSON.stringify(data)).
        then(function (response) {
            $rootScope.alerts.push({type: "success", msg: "Players saved"});
        }, function (response) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Request failed with response '" + response.data + "' and status code: " + response.status
            });
        });
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
boxleagueApp.controller('mainCtrl', function ($scope, $rootScope, $http, $location) {
    $scope.user = {};

    //$rootScope.alerts = [];

    $rootScope.close = function (index) {
        $rootScope.alerts.splice(index, 1);
    };

    //$rootScope.isAuth = false;

    // Register the login() function
    $scope.login = function () {
        if (!$scope.username || !$scope.password) {
            return;
        }

        var promise = $http.post('/login', {
            username: $scope.username,
            password: $scope.password,
        });

        promise.success(function (response) {
            //$rootScope.isAuth = true;
            $rootScope.login = response.name;
            $location.url('/myBox');
            //boxleagueApp.run();
        });

        promise.error(function (response, status) {
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