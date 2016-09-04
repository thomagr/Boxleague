// MODULE
var boxleagueApp = angular.module('boxleagueApp', ['ngRoute', 'ngResource', 'ui.bootstrap']);

// ROUTES

boxleagueApp.run(function ($rootScope) {

    $rootScope.alerts = [];

    // returning a promise
    // $rootScope.init = function () {
    //     var error = function (msg) {
    //         $rootScope.alerts.push(msg);
    //     };
    //
    //     var successBoxleague = function (boxleagues) {
    //         //$rootScope.alerts.push({type: "success", msg: "loaded boxleague"});
    //
    //         var boxleague = boxleagues[boxleagues.length - 1];
    //
    //         // dereference all of the player and game ids
    //         boxleague.boxes.forEach(function (box, index, arr) {
    //             arr[index].players = [];
    //             box.playerIds.forEach(function (id) {
    //                 arr[index].players.push(findById($rootScope.players, id));
    //             });
    //             arr[index].games = [];
    //             box.gameIds.forEach(function (id) {
    //                 arr[index].games.push(findById($rootScope.games, id));
    //             });
    //         });
    //         $rootScope.boxleague = boxleague;
    //     };
    //
    //     var successGames = function (response) {
    //         //$rootScope.alerts.push({type: "success", msg: "loaded games"});
    //
    //         $rootScope.games = response.data;
    //         // dereference all of the player ids
    //         // $rootScope.games.forEach(function (game, index, arr) {
    //         //     arr[index].home = findById($rootScope.players, game.homeId);
    //         //     arr[index].away = findById($rootScope.players, game.awayId);
    //         // });
    //         return getArray('boxleagues', $http, successBoxleague, error)
    //     };
    //
    //     var successPlayers = function (response) {
    //         //$rootScope.alerts.push({type: "success", msg: "loaded players"});
    //
    //         $rootScope.players = response.data;
    //         return $http.get('/games').then(successGames, error);
    //     };
    //
    //     if (!$rootScope.players || !$rootScope.games || !$rootScope.boxleague) {
    //         return $http.get('/players').then(successPlayers, error);
    //     } else {
    //         return promise.resolve("success");
    //     }
    // };

    // required for message alerts
    $rootScope.close = function (index) {
        $rootScope.alerts.splice(index, 1);
    };
});

// function getArray(name, http, success, error) {
//     console.log('getArray /service?name=' + name);
//
//     var promise = http.get('/service?name=' + name);
//
//     promise.success(function (response, status) {
//         if (response.rows && response.rows.length) {
//             var arr = [];
//             response.rows.forEach(function (item) {
//                 arr.push(item.doc);
//             });
//             success(arr);
//         } else {
//             error({type: "warning", msg: "No " + name + " found"});
//         }
//     });
//
//     promise.error(function (response, status) {
//         error({
//             type: "danger",
//             msg: "Request failed with response '" + response + "' and status code: " + status
//         })
//     });
//
//     return promise;
// }
// function getObject(name, http, success, error) {
//     console.log('getObject /service?name=' + name);
//
//     var promise = http.get('/service?name=' + name);
//
//     promise.success(function (response, status) {
//         if (response.rows && response.rows.length) {
//             success(response.rows[0].doc);
//         } else {
//             error({type: "warning", msg: "No " + name + " found"});
//         }
//     });
//
//     promise.error(function (response, status) {
//         error({
//             type: "danger",
//             msg: "Request failed with response '" + response + "' and status code: " + status
//         })
//     });
//
//     return promise;
// }

