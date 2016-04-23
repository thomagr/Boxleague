function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
function getColumns(rows) {
    if (!rows) {
        return [];
    }
    var columns = [];
    rows.forEach(function (row) {
        Object.keys(row).forEach(function (column) {
            if (columns.indexOf(column) === -1) {
                columns.push(column);
            }
        });
    });
    return columns;
}
function removeColumn(columns, name) {
    columns.splice(columns.indexOf(name), 1);
    return columns;
}
function filterColumns(columns) {
    //return columns;
    var filter = [];
    var skip = ['Id', '_id', '_rev', '$$hashKey', 'boxes', "boxleague"];
    columns.forEach(function (column) {
        for (var i = 0; i < skip.length; i++) {
            if (column.indexOf(skip[i]) >= 0) {
                return;
            }
        }
        filter.push(column);
    });
    return filter;
}
function getDayClass(data) {
    var date = data.date,
        mode = data.mode;
    if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

        for (var i = 0; i < $scope.events.length; i++) {
            var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

            if (dayToCheck === currentDay) {
                return $scope.events[i].status;
            }
        }
    }

    return '';
}
function check(object, type) {
    switch (type) {
        case "array":
            if (!object instanceof Array) {
                throw "object is not of type " + type;
            }
            break;
        case "Date":
            if (!object instanceof Date) {
                throw "object is not of type " + type;
            }
            break;
        default:
            if (typeof object !== type) {
                throw "object is not of type " + type;
            }
    }
}
function createBoxleague(id, name, start, end, boxes) {

    check(id, "string");
    check(name, "string");
    check(start, "Date");
    check(end, "Date");
    check(boxes, "array");

    return {
        _id: id,

        name: name,

        // dates
        start: start,
        end: end,

        // boxes
        boxes: boxes
    }
}
function createGame(id, homeId, homeDetails, awayId, awayDetails, boxleagueName, boxleagueId, boxName) {

    check(id, "string");
    check(homeId, "string");
    check(homeDetails, "object");
    check(homeDetails.name, "string");
    check(awayId, "string");
    check(awayDetails, "object");
    check(awayDetails.name, "string");
    check(boxleagueName, "string");
    check(boxleagueId, "string");
    check(boxName, "string");

    return {
        _id: id,

        // players
        homeId: homeId,
        home: homeDetails,
        awayId: awayId,
        away: awayDetails,

        // boxleague
        boxleague: boxleagueName,
        boxleagueId: boxleagueId,

        // box
        box: boxName
    }
}
function cleanScore(score) {
    if (!score) {
        return score;
    }

    // games shouldn't have 0:0 or unwanted strings
    score = score.replace(/0:0/g, "");
    score = score.replace(/  /g, " ");
    score = score.trim();

    return score;
}
var findObjectsMatchingName = function (source, name) {
    var results = [];
    source.forEach(function (item) {
        if (item.box === name) {
            results.push(item);
        }
    });
    if (results.length === 0) {
        throw "Couldn't find item with name: " + name;
    }
    return results;
};
var findIdsMatchingName = function (source, name) {
    return findObjectsMatchingName(source, name).map(function (item) {
        return item._id
    });
};
function findById(source, id) {
    for (var i = 0; i < source.length; i++) {
        if (source[i]._id === id) {
            return source[i];
        }
    }
    throw "Couldn't find object with id: " + id;
}
function findByName(source, name) {
    if (!source) {
        throw "No source provided";
    }

    if (!name) {
        throw "No name provided";
    }

    for (var i = 0; i < source.length; i++) {
        if (source[i].name === name) {
            return source[i];
        }
    }
    throw "Couldn't find object with name: " + JSON.stringify(name);
}
// Has someone won correctly
function isCompleteScore(score) {
    if (!score || !score.length) {
        return 0;
    }

    if (score === "W:0" || score === "0:W") {
        return 1;
    }

    if (score === "w:0" || score === "0:w") {
        return 1;
    }

    if (score === "0:0 0:0") {
        return 1;
    }

    var sets = score.split(" ");
    var home = 0;
    var away = 0;

    sets.forEach(function (set) {
        var games = set.split(":");
        if (parseInt(games[0]) > parseInt(games[1])) {
            home++;
        }
        if (parseInt(games[0]) < parseInt(games[1])) {
            away++;
        }
    });

    if (home === 2 && (away === 1 || away === 0 )) {
        return 1;
    }
    if (away === 2 && (home === 1 || home === 0 )) {
        return 1;
    }
    return 0;
}
// do we have valid values for a home:away tiebreak
function isTiebreakScore(score) {
    var games = score.split(":");

    if (games.length !== 2) {
        return 0;
    }

    var home = parseInt(games[0]);
    var away = parseInt(games[1]);

    // score is not set
    if (home + away === 0) {
        return 0;
    }

    // valid scores e.g. 1:0
    if ((home === 1 && away === 0) || (home === 0 && away === 1)) {
        return 1;
    }

    // score is not set
    if (home < 10 && away < 10) {
        return 0;
    }

    // values are not in range
    if (home < 0 || away < 0) {
        return 0;
    }

    var diff = Math.abs(home - away);
    if (home === 10 && home - away >= 2) {
        return 1;
    } else if (away === 10 && away - home >= 2) {
        return 1;
    } else if (home > 10 && diff === 2) {
        return 1;
    } else if (away > 10 && diff === 2) {
        return 1;
    }

    return 0;
}
// Do we have valid text in the sets score set1 set2 set3
function isSetsScore(score) {
    if (score === "W:0" || score === "0:W") {
        return 1;
    }

    if (score === "w:0" || score === "0:w") {
        return 1;
    }

    if (score === "0:0 0:0") {
        return 1;
    }

    var sets = score.split(" ");
    if (sets.length === 2 && isSetScore(sets[0]) && isSetScore(sets[1])) {
        return 1;
    }
    if (sets.length === 3 && isSetScore(sets[0]) && isSetScore(sets[1]) && isSetScore(sets[2])) {
        return 1;
    }
    if (sets.length === 3 && isSetScore(sets[0]) && isSetScore(sets[1]) && isTiebreakScore(sets[2])) {
        return 1;
    }

    return 0;
}
// Do we have a valid set score
function isSetScore(score) {
    var games = score.split(":");

    if (games.length !== 2) {
        return 0;
    }

    var home = parseInt(games[0]);
    var away = parseInt(games[1]);

    // score is not set
    if (home + away === 0) {
        return 0;
    }

    // score is not set
    if (home < 6 && away < 6) {
        return 0;
    }

    // values are not in range
    if (home < 0 || away < 0) {
        return 0;
    }

    // values are not in range
    if (home > 7 || away > 7) {
        return 0;
    }

    // tie break set
    if (home === 7 && (away === 6 || away === 5)) {
        return 1;
    }

    // tie break set
    if (away === 7 && (home === 6 || home === 5)) {
        return 1;
    }

    // valid scores
    if (home === 6 && home - away >= 2) {
        return 1;
    } else if (away === 6 && away - home >= 2) {
        return 1;
    }

    return 0;
}
function calculateLeaderboard(games) {

    var leaderboard = [];
    var findInLeaderboard = function (player, box) {
        for (var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].name === player) {
                return leaderboard[i];
            }
        }
        leaderboard.push({
            name: player,
            score: 0,
            played: 0,
            won: 0,
            lost: 0,
            setsFor: 0,
            setsAgainst: 0,
            setsDiff: 0,
            box: box
        });
        return leaderboard[leaderboard.length - 1];
    };

    var calculateScore = function (score) {
        // validate we have a score
        if (!isCompleteScore(score) || !isSetsScore(score)) {
            return {home: 0, away: 0, setsHome: 0, setsAway: 0};
        }

        var setsString = score.split(" ");
        var sets = [];
        setsString.forEach(function (set) {
            var gameString = set.split(":");
            sets.push([parseInt(gameString[0]), parseInt(gameString[1])]);
        });

        var home = 0, away = 0, setsHome = 0, setsAway = 0;
        if (sets.length === 2) {
            if (sets[0][0] > sets[0][1]) {
                setsHome = 2;
                home = 18;
                away = sets[0][1];
                away += sets[1][1];
            } else {
                setsAway = 2;
                away = 18;
                home = sets[0][0];
                home += sets[1][0];
            }
        } else if (sets.length === 3) {
            if (sets[2][0] > sets[2][1]) {
                home = 12;
                setsHome = 2;
                setsAway = 1;
                away = Math.min(6, sets[0][1]);
                away += Math.min(6, sets[1][1]);
            } else {
                away = 12;
                setsAway = 2;
                setsHome = 1;
                home = Math.min(6, sets[0][0]);
                home += Math.min(6, sets[1][0]);
            }
        }

        return {home: home, away: away, setsHome: setsHome, setsAway: setsAway};
    };

    games.forEach(function (game) {

        var score = calculateScore(game.score);


        var home = findInLeaderboard(game.home, game.box);
        var away = findInLeaderboard(game.away, game.box);

        if (score.home > 0 || score.away > 0) {

            home.played++;
            away.played++;
            home.score += score.home;
            away.score += score.away;

            home.setsFor += score.setsHome;
            home.setsAgainst += score.setsAway;
            away.setsFor += score.setsAway;
            away.setsAgainst += score.setsHome;

            if (score.home > score.away) {
                home.won++;
                away.lost++;
            } else {
                away.won++;
                home.lost++;
            }
        }
    });

    return leaderboard;
};

boxleagueApp.filter('formatString', function ($filter) {
    return function (input) {
        if (input instanceof Date) {
            return $filter('date')(input, 'dd MMM yyyy');
        } else if (typeof input === "string" && input.substring(0, 3) === "201" && input.indexOf('Z', input.length - 1) !== -1) {
            return $filter('date')(input, 'dd MMM yyyy')
        } else {
            return input;
        }
    }
});

boxleagueApp.controller('forcastCtrl', ['$scope', '$log', '$resource', '$routeParams', '$http', '$timeout', function ($scope, $log, $resource, $routeParams, $http, $timeout) {
    $log.info("forcastCtrl");

    $scope.location = $routeParams.location;

    $scope.convertToDegC = function (degK) {
        return Math.round(degK - 273.15);
    };

    $scope.convertToDate = function (dt) {
        return new Date(dt * 1000);
    };

    $timeout(function () {
        var hourlyPromise = $http.get('/weatherHourly?location=' + $scope.location);
        hourlyPromise.success(function (response) {
            $scope.hourlyWeatherResult = response;
        });
        hourlyPromise.error(function (response, status) {
            error({
                type: "danger",
                msg: "Request failed with response '" + response + "' and status code: " + status
            })
        });
    }, 500);

    $timeout(function () {
        var dailyPromise = $http.get('/weatherDaily?location=' + $scope.location);
        dailyPromise.success(function (response) {
            $scope.dailyWeatherResult = response;
        });
        dailyPromise.error(function (response, status) {
            error({
                type: "danger",
                msg: "Request failed with response '" + response + "' and status code: " + status
            })
        });
    }, 1000);

}]);
boxleagueApp.controller('welcomeCtrl', ['$scope', '$rootScope', '$log', function ($scope, $rootScope, $log) {
    $log.info("welcomeCtrl");

    $rootScope.alerts = [];
}]);
boxleagueApp.controller('tableCtrl', ['$scope', '$log', '$http', '$rootScope', '$routeParams', function ($scope, $log, $http, $rootScope, $routeParams) {
    $log.info("tableCtrl");


    var table = $routeParams.name;
    $scope.title = table;
    if (table.indexOf('s', table.length - 1)) {
        $scope.type = table.substring(0, table.length - 1);
    } else {
        $scope.type = table;
    }

    $http.get('/' + table).then(function (response) {
        $scope.rows = response.data;
        var columns = getColumns($scope.rows);
        var filter = filterColumns(columns);
        if (filter.indexOf("schedule") !== -1) {
            filter = removeColumn(filter, "schedule");
            filter.unshift("schedule");
        }
        $scope.columns = filter;
        $scope.sortType = filter[0];
    }, function (response) {
        $scope.rows = [];
        $scope.colunns = [];
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read " + table + " failed with error '" + response.data
        });
    });

    $scope.sortReverse = false;
    $scope.searchName = '';
    $scope.sortType = '';

    $scope.toTitleCase = toTitleCase;
    $scope.sortColumn = function (column) {
        $scope.sortType = column;
        $scope.sortReverse = !$scope.sortReverse;
        return (column);
    }
}]);
boxleagueApp.controller('formCtrl', ['$scope', '$log', '$http', '$rootScope', '$routeParams', function ($scope, $log, $http, $rootScope, $routeParams) {
    $log.info("formCtrl");

    var table = $routeParams.name;
    var id = $routeParams.id;

    $scope.title = toTitleCase(table);

    // find all available columns
    $http.get('/' + table + 's').then(function (response) {
        var data = response.data;
        var columns = getColumns(data);
        $scope.columns = filterColumns(columns);
    }, function (response) {
        $scope.rows = [];
        $scope.colunns = [];
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read " + table + " failed with error '" + response.data
        });
    });

    $http.get('/' + table + '/' + id).then(function (response) {
        $scope.data = response.data;
        if ($scope.data.name && $scope.data.name === $rootScope.login || $rootScope.admin) {
            $scope.edit = true;
        }
    }, function (response) {
        $scope.rows = [];
        $scope.colunns = [];
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read " + table + " failed with error '" + response.data
        });
    });
    $scope.toTitleCase = toTitleCase;
    $scope.submit = function () {
        console.log("saving data ...");

        // clean data before save
        var data = $scope.data;
        data = clone(data);
        delete data["$$hashKey"];

        $http.post('/' + table + '/' + $scope._id, JSON.stringify(data)).then(function (response) {
            $scope.data._id = response.data.id;
            $scope.data._rev = response.data.rev;
            $rootScope.alerts.push({type: "success", msg: " Saved"});
        }, function (response) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Save failed with error '" + response.data + "'. Refresh the page, check and try again."
            });
        });
    };
    $scope.delete = function () {
        console.log("deleting data ...");

        $http.delete('/' + table + '/' + $scope.data._id + '/' + $scope.data._rev).then(function () {
            $rootScope.alerts.push({type: "success", msg: "Deleted"});
        }, function (response) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Delete failed with error '" + response.data + "'. Refresh the page, check and try again."
            });
        });
    };
    // special cases
    $scope.readOnly = function (column) {
        return table === "player" && column === "name"
    }
}]);
boxleagueApp.controller('settingsCtrl', ['$scope', '$log', '$rootScope', '$location', '$http', function ($scope, $log, $rootScope, $location, $http) {
    $log.info("settingsCtrl");

    $http.get('/players').then(function (response) {
        $scope.players = response.data;
        $location.url('/form/player/' + findByName($scope.players, $rootScope.login)._id);
    }, function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data + "'"
        });
    });
}]);
boxleagueApp.controller('myBoxCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', function ($scope, $rootScope, $log, $location, $http) {
    $log.info("myBoxCtrl");

    $scope.login = $rootScope.login;

    $http.get('/boxleagues').then(function (response) {
        $scope.boxleagues = response.data;
        $scope.boxleagues.forEach(function (boxleague) {
            boxleague.boxes.forEach(function (box) {
                if (box.players.indexOf($rootScope.login) !== -1) {
                    $location.url('/boxleague/' + boxleague._id + '/box/' + box.name);
                }
            })
        })
    }, function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data + "'"
        });
    });
}]);
boxleagueApp.controller('scoreboardCtrl', function ($scope, $uibModalInstance, game) {

    $scope.score = game.score;
    if (game.date instanceof Date) {
        $scope.date = game.date;
    } else if (typeof game.date == "string" && game.date.length) {
        $scope.date = new Date(game.date);
    } else {
        $scope.date = game.date;
    }
    // if(game.date && game.date.length || typeof game.date === 'object'){
    //     $scope.date = new Date(game.date);
    // }

    $scope.home = game.home;
    $scope.away = game.away;

    $scope.reset = function () {
        $scope.score = "";
        $scope.date = "";
        load();
    };

    // load
    var load = function () {
        $scope.sets = [];

        // initialise
        [1, 2, 3].forEach(function (set) {
            $scope.sets.push({name: "Set " + set, game1: "0", game2: "0"});
        });

        var sets = $scope.score ? $scope.score.split(" ") : [];
        for (var i = 0; i < sets.length; i++) {
            var set = sets[i];
            var games = set.split(":");
            var game1 = games[0] || "0";
            var game2 = games[1] || "0";
            $scope.sets[i].game1 = game1;
            $scope.sets[i].game2 = game2;
        }
    };

    var setsToScore = function (sets) {
        var score = "";
        sets.forEach(function (set) {
            score += set.game1 + ":" + set.game2 + " ";
        });
        score = score.trim();
        score = score.replace(/ 0:0$/, "");
        return score;
    };

    $scope.notValidScore = function () {
        var score = setsToScore($scope.sets);

        var validSetsScore = isSetsScore(score);
        var validCompleteScore = isCompleteScore(score);

        return !(validSetsScore && validCompleteScore);
    };

    load();

    $scope.decrement = function (score) {
        var num = parseInt(score);
        num = Math.max(0, num - 1);

        return num.toString();
    };

    $scope.increment = function (score, index) {
        var num = parseInt(score);
        var max = index === 2 ? 99 : 7;
        num = Math.min(max, num + 1);

        return num.toString();
    };

    $scope.ok = function () {
        game.score = cleanScore(setsToScore($scope.sets));
        game.date = $scope.date;
        // if($scope.date instanceof Date){
        //     game.date = JSON.stringify($scope.date);
        // } else {
        //     game.date = $scope.date;
        // }

        $uibModalInstance.close(game);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss(null);
    };

    // For Dates dialog
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(2016, 1, 1),
        showWeeks: true
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(2016, 1, 1),
        startingDay: 1
        //initDate: new Date
    };
    $scope.startPopUp = {
        opened: false
    };
    $scope.openStartPopUp = function () {
        $scope.startPopUp.opened = true;
    };
    $scope.endPopUp = {
        opened: false
    };
    $scope.openEndPopUp = function () {
        $scope.endPopUp.opened = true;
    };
    // end for Dates dialog
});
boxleagueApp.controller('boxleagueCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', function ($scope, $rootScope, $log, $location, $http) {
    $log.info("boxleagueCtrl");

    $http.get('/boxleagues').then(function (response) {
        $scope.boxleagues = response.data;
        $scope.boxleagues.forEach(function (boxleague) {
            $location.url('/boxleague/' + boxleague._id + '/boxes');
        })
    }, function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data + "'"
        });
    });
}]);
boxleagueApp.controller('leaderboardMainCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', function ($scope, $rootScope, $log, $location, $http) {
    $log.info("boxleagueCtrl");

    $http.get('/boxleagues').then(function (response) {
        $scope.boxleagues = response.data;
        $scope.boxleagues.forEach(function (boxleague) {
            $location.url('/boxleague/' + boxleague._id + '/leaderboard');
        })
    }, function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data + "'"
        });
    });
}]);
boxleagueApp.controller('boxesCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("boxesCtrl");

    $scope.id = $routeParams.id;

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read boxleague failed with error '" + response.data
        });
    };

    $http.get('/boxleague/' + $scope.id).then(function (response) {
        $scope.boxleague = response.data;
    }, error);

    // sort order, if we have boxes use the box number
    $scope.sortElement = function (item) {
        if (item.name.indexOf("Box ") !== -1) {
            return parseInt(item.name.replace("Box ", ""));
        } else {
            return item.name;
        }
    }
}]);
boxleagueApp.controller('boxCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$q', '$uibModal', function ($scope, $log, $resource, $routeParams, $rootScope, $http, $q, $uibModal) {
    $log.info("boxCtrl");

    $scope.boxName = $routeParams.box;
    $scope.id = $routeParams.id;

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data
        });
    };
    $http.get('/boxleague/' + $scope.id).then(function (response) {
        $scope.boxleague = response.data;
        $http.get('/players').then(function (response) {
            $scope.players = response.data;
            $http.get('/games').then(function (response) {
                $scope.games = response.data;
                $scope.boxleague.boxes.forEach(function (box, index, arr) {
                    arr[index].players = [];
                    box.playerIds.forEach(function (id) {
                        arr[index].players.push(findById($scope.players, id));
                    });
                    arr[index].games = [];
                    box.gameIds.forEach(function (id) {
                        arr[index].games.push(findById($scope.games, id));
                    });
                });
                setUpBox();
            }, error)
        }, error);
    }, error);

    // modal pop-up
    $scope.openByGrid = function (column, row, index) {
        // if the colum is not a score column then return
        switch (typeof column) {
            case 'string':
                return;
            case 'object':
                break;
            default:
                return;
        }

        // if the row login is not the logged in person ignore
        if (row[index].home != $rootScope.login && row[index].away != $rootScope.login) {
            return;
        }
//
//        var score;
//        if(row[index].game.home === row[index].home){
//            score = row[index].game.score;
//        } else {
//            score = reverse(row[index].game.score);
//        }

        open(row[index].game);
    };
    // modal pop-up
    $scope.openByFixture = function (game) {
        // if the row login is not the logged in person ignore
        if (game.home != $rootScope.login && game.away != $rootScope.login) {
            return;
        }

        open(game);
    };
    var open = function (game) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'scoreboard.html',
            controller: 'scoreboardCtrl',
            resolve: {
                game: function () {
                    return game;
                }
            }
        });

        modalInstance.result.then(function (game) {
            if (!game) {
                return;
            }

            $scope.save(game._id);
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };
    // end pop-up
    $scope.save = function (id) {
        console.log('submit game ' + id);

        var game = findById($scope.games, id);
        // clean data before save
        game = clone(game);
        delete game["$$hashKey"];
        game.score = cleanScore(game.score);

        var promise = $http.post('/game/' + game._id, JSON.stringify(game));

        promise.success(function (response) {
            game = findById($scope.games, id);
            game._rev = response.rev;
            $rootScope.alerts.push({type: "success", msg: " Saved"});
            setUpBox();
        });

        promise.error(function (response) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Save failed with error '" + response + "'. Refresh the page, check and try again."
            });
        });
    };

    $scope.readOnly = function (column, row, index) {
        //console.log(JSON.stringify(row[index]));

        if (index === 0) {
            return true;
        } else if (row[index].home === "Free Week") {
            return true;
        } else if (row[index].away === "Free Week") {
            return true;
        } else if (row[index].home === $rootScope.login) {
            return false;
        } else if (row[index].away === $rootScope.login) {
            return false;
        }
        return true;
    };

    var setUpBox = function () {
        $scope.box = findByName($scope.boxleague.boxes, $scope.boxName);
        $scope.boxPlayers = $scope.box.players;
        $scope.boxGames = $scope.box.games;

        $scope.tableHeaders = [];
        $scope.tableRows = [];
        $scope.tableHeaders.push($scope.box.name);

        // calculate the leaderboard details
        $scope.leaderboard = calculateLeaderboard($scope.boxGames);
        var total = 0, played = 0;
        $scope.boxGames.forEach(function (game) {
            total++;
            if (isCompleteScore(game.score) && isSetsScore(game.score)) {
                played++;
            }
        });
        $scope.played = played;
        $scope.total = total;
        $scope.percent = ((played / total) * 100).toFixed(1);
        if ($scope.percent < 25) {
            $scope.type = 'danger';
        } else if ($scope.percent < 50) {
            $scope.type = 'warning';
        } else if ($scope.percent < 75) {
            $scope.type = 'info';
        } else {
            $scope.type = 'success';
        }

        // for the games table
        var columns = getColumns($scope.boxGames);
        var filter = filterColumns(columns);
        //filter = removeColumn(filter, "boxleague");
        filter = removeColumn(filter, "box");
        filter = removeColumn(filter, "schedule");
        filter.unshift("schedule");
        $scope.boxColumns = filter;
        $scope.boxSortType = "schedule";
        $scope.boxSortReverse = false;
        $scope.boxSearchName = "";
        $scope.gamesType = "game";
        $scope.sortBoxColumn = function (column) {
            $scope.boxSortType = column;
            $scope.boxSortReverse = !$scope.boxSortReverse;
            return (column);
        };

        // for the players table
        columns = getColumns($scope.boxPlayers);
        filter = filterColumns(columns);
        $scope.playerColumns = filter;
        $scope.playerSortType = "name";
        $scope.playerSortReverse = false;
        $scope.playerSearchName = "";
        $scope.playersType = "player";
        $scope.sortPlayerColumn = function (column) {
            $scope.playerSortType = column;
            $scope.playerSortReverse = !$scope.playerSortReverse;
            return (column);
        };

        $scope.toTitleCase = toTitleCase;

        // set-up the boxleage table
        $scope.boxPlayers.forEach(function (player1) {
            var row = [];
            row.push(player1.name);
            $scope.tableRows.push(row);
            $scope.tableHeaders.push(player1.name);

            $scope.boxPlayers.forEach(function (player2) {
                try {
                    var game = findGameByPlayers($scope.boxGames, player1, player2);
                    row.push({game: game, home: player1.name, away: player2.name});
                }
                catch (err) {
                    row.push("");
                }
            })
        });
    };

    function findGameByPlayers(games, player1, player2) {
        for (var i = 0; i < games.length; i++) {
            if ((games[i].homeId === player1._id && games[i].awayId === player2._id) ||
                (games[i].homeId === player2._id && games[i].awayId === player1._id)) {
                return (games[i]);
            }
        }
        throw "findGameByPlayers couldn't find game with player1: " + player1._id + " and player2: " + player2._id;
    }

    $scope.fixtureFilter = function (item) {
        return $scope.search.length === 0 | item.home.name.indexOf($scope.search) >= 0 || item.away.name.indexOf($scope.search) >= 0;
    };

    var reverse = function (score) {
        if (!score) {
            return "";
        }
        var sets = score.split(" ");
        var text = "";
        sets.forEach(function (item) {
            var games = item.split(":");
            var game1 = games[1] || "";
            var game0 = games[0] || "";
            text += game1;
            if (game0.length) {
                text += ":" + game0;
            }
            text += " ";
        });
        return text;
    };
    $scope.getCellScore = function (column, row, index) {
        switch (typeof column) {
            case 'string':
                if (!column.length) {
                    return "x";
                } else {
                    return column;
                }
            case 'object':
                break;
            default:
                return "?";
        }

        var cell;
        if (row[index].game.home.name === row[index].home) {
            cell = row[index].game.score;
        } else {
            cell = reverse(row[index].game.score);
        }
        //console.log('cell %s', cell)
        switch (cell) {
            case null:
                return "null";
            //case "":
            //    return row[index].home === $rootScope.login ? "0:0" : "";
            default:
                return cell;
        }
    };

    $scope.validInput = /^([W]:[0])|([0]:[W])|[0-9]+:[0-9]+ [0-9]+:[0-9]+ [0-9]+:[0-9]+|[0-9]+:[0-9]+ [0-9]+:[0-9]+$/;

    $scope.inputScore = function (game) {
        game.error = "";
        game.save = false;

        game.score = game.score.replace(/[\-.;,]/g, ":");
        game.score = game.score.replace(/::/g, ":");
        game.score = game.score.replace(/  /g, " ");
        game.score = game.score.replace(/[^W: \d]/g, "");
        game.score = game.score.substring(0, 13);

        if (!game.score) {
            // if the game score is blanked out
            game.save = true;
            return;
        }

        var validStr = $scope.validInput.test(game.score);
        if (!validStr) {
            game.error = "?";
            return;
        }

        var validSetsScore = isSetsScore(game.score);
        if (!validSetsScore) {
            game.error = "!";
            return;
        }

        var validCompleteScore = isCompleteScore(game.score);
        if (!validCompleteScore) {
            game.error = "*";
            return;
        }

        if (validStr && validSetsScore && validCompleteScore) {
            game.save = true;
        }
    };
}]);
boxleagueApp.controller('leaderboardCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("leaderboardCtrl");

    $scope.id = $routeParams.id;

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data
        });
    };
    $http.get('/boxleague/' + $scope.id).then(function (response) {
        $scope.boxleague = response.data;
        $http.get('/games').then(function (response) {
            $scope.games = response.data;
            $scope.leaderboard = calculateLeaderboard($scope.games);
            var total = 0, played = 0;
            $scope.games.forEach(function (game) {
                total++;
                if (isCompleteScore(game.score) && isSetsScore(game.score)) {
                    played++;
                }
            });
            $scope.played = played;
            $scope.total = total;
            $scope.percent = ((played / total) * 100).toFixed(1);
            if ($scope.percent < 25) {
                $scope.type = 'danger';
            } else if ($scope.percent < 50) {
                $scope.type = 'warning';
            } else if ($scope.percent < 75) {
                $scope.type = 'info';
            } else {
                $scope.type = 'success';
            }
        }, error);
    }, error);
}]);

boxleagueApp.controller('importBoxleagueCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importBoxleagueCtrl");

    $http.get('/players').then(function (response) {
        $scope.players = response.data;
        if ($rootScope.boxleague) {
            $scope.boxleagueName = $rootScope.boxleague.name;
            $scope.startDate = $rootScope.boxleague.start;
            $scope.endDate = $rootScope.boxleague.end;
        }
    }, function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data + "'"
        });
    });

    $scope.changeEvent = "";
    $scope.filename = "";

    // For Dates dialog
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(2016, 1, 1),
        startingDay: 1,
        initDate: new Date
    };
    $scope.startPopUp = {
        opened: false
    };
    $scope.openStartPopUp = function () {
        $scope.startPopUp.opened = true;
    };
    $scope.endPopUp = {
        opened: false
    };
    $scope.openEndPopUp = function () {
        $scope.endPopUp.opened = true;
    };
    // end for Dates dialog

    $scope.reset = function () {
        delete $rootScope.games;
        delete $rootScope.boxleague;
        delete $scope.boxleagueName;
        $scope.startDate = new Date;
        $scope.endDate = new Date;
    };

    $scope.submit = function () {
        var boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        $rootScope.saveImportedBoxleague(boxleague, $rootScope.games, $rootScope.players);
    };

    $scope.$watch('changeEvent', function () {
        if (!$scope.changeEvent) {
            return
        }

        $scope.filename = $scope.changeEvent.target.files[0].name;
        $rootScope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});

                // add some default values is not provided
                $scope.boxleagueName = $scope.boxleagueName || "Import";
                $scope.startDate = $scope.startDate || new Date;
                $scope.endDate = $scope.endDate || new Date;

                $rootScope.boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, []);
                var idCount = 0; // temp ids for games

                workbook.SheetNames.forEach(function (boxName) {

                    if (boxName.indexOf("Box ") === -1) {
                        return;
                    }

                    var games = []; // games on this sheet

                    var content = XLSX.utils.sheet_to_csv(workbook.Sheets[boxName]);

                    var matches = content.match(/([a-zA-Z' ]*),v.,([a-zA-Z' ]*)/g);
                    matches.forEach(function (pairing) {
                        var players = pairing.split(",v.,");

                        // player fix
                        if (players[0] === "Anthony Dore") {
                            players[0] = "Antony Dore"
                        }
                        if (players[1] === "Anthony Dore") {
                            players[1] = "Antony Dore"
                        }

                        var game = createGame(idCount.toString(),
                            findByName($rootScope.players, players[0])._id,
                            findByName($rootScope.players, players[0]),
                            findByName($rootScope.players, players[1])._id,
                            findByName($rootScope.players, players[1]),
                            $rootScope.boxleague.name,
                            $rootScope.boxleague._id,
                            boxName);

                        idCount++;
                        $rootScope.games.push(game);
                        games.push(game);
                    });

                    // parse out the week information and use the date and time to create the game time
                    var weeks = [];
                    matches = content.match(/(Week \d,\d*\/\d*\/\d*,\d*.\d*)/g);
                    matches.forEach(function (weekItem) {
                        var details = weekItem.split(",");
                        var weekNum = details[0].replace("Week ", "");
                        var week = {week: weekNum, date: details[1], time: details[2].replace('.', ':')};
                        weeks.push(week);
                    });

                    // hardcoded for now
                    for (var i = 0; i < 6; i++) {
                        games[i].schedule = new Date(weeks[i % 2].date + " " + weeks[i % 2].time);
                    }
                    for (i = 6; i < 12; i++) {
                        games[i].schedule = new Date(weeks[i % 2 + 2].date + " " + weeks[i % 2 + 2].time);
                    }
                    for (i = 12; i < 15; i++) {
                        games[i].schedule = new Date(weeks[4].date + " " + weeks[4].time);
                    }
                    games.sort(function (a, b) {
                        //return a.week.week.replace("Week ","") - b.week.week.replace("Week ","");
                        return a.schedule - b.schedule;
                    });

                    var playerNames = {};
                    games.forEach(function (game) {
                        playerNames[game.home.name] = true;
                        playerNames[game.away.name] = true;
                    });
                    playerNames = Object.keys(playerNames).map(function (key) {
                        return key
                    });
                    playerNames.sort();

                    var ids = [];
                    var players = [];
                    playerNames.forEach(function (player) {
                        ids.push(findByName($rootScope.players, player)._id);
                        players.push(findByName($rootScope.players, player));
                    });

                    var box = {
                        name: boxName,
                        games: games,
                        players: players,
                        playerIds: ids,
                        gameIds: findIdsMatchingName(games, boxName)
                    };
                    //$scope.boxes.push(box);
                    //$rootScope.boxleague.boxes = $scope.boxes;
                    $rootScope.boxleague.boxes.push(box);
                });
                //$scope.boxleague = $rootScope.boxleague;
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);
boxleagueApp.controller('importBoxleagueFileCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importBoxleagueFileCtrl");

    $rootScope.init().then(function () {
        if ($rootScope.boxleague) {
            $scope.boxleagueName = $rootScope.boxleague.name;
            $scope.startDate = $rootScope.boxleague.start;
            $scope.endDate = $rootScope.boxleague.end;
        } else {
            $scope.boxleagueName = "Import";
            $scope.startDate = new Date;
            $scope.endDate = new Date;
        }
    });

    $scope.changeEvent = "";
    $scope.filename = "";

    // For Dates dialog
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(2016, 1, 1),
        startingDay: 1,
        initDate: new Date
    };
    $scope.startPopUp = {
        opened: false
    };
    $scope.openStartPopUp = function () {
        $scope.startPopUp.opened = true;
    };
    $scope.endPopUp = {
        opened: false
    };
    $scope.openEndPopUp = function () {
        $scope.endPopUp.opened = true;
    };
    // end for Dates dialog

    $scope.reset = function () {
        delete $rootScope.games;
        delete $rootScope.boxleague;
        delete $scope.boxleagueName;
        $scope.startDate = new Date;
        $scope.endDate = new Date;
    };

    var findPlayersInBox = function (source, box) {
        var players = [];
        source.forEach(function (item) {
            if (item.box === box) {
                players.push(item.name);
            }
        });
        if (players.length === 0) {
            throw "Couldn't find players in box: " + box;
        }
        return players;
    };

    $scope.submit = function () {
        var boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        $rootScope.saveImportedBoxleague(boxleague, $rootScope.games, $rootScope.players);
    };

    $scope.$watch('changeEvent', function () {
        if (!$scope.changeEvent) {
            return
        }

        $scope.filename = $scope.changeEvent.target.files[0].name;
        $rootScope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;

                // add some default values is not provided
                $scope.boxleagueName = $scope.boxleagueName || "Import";
                $scope.startDate = $scope.startDate || new Date;
                $scope.endDate = $scope.endDate || new Date;

                $rootScope.boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, []);

                var playersAndBox = [];
                var boxNames = [];
                var lines = data.split('\n');
                lines.forEach(function (line) {
                    if (!line || line.length === 0) {
                        return;
                    }
                    var items = line.split(",");
                    playersAndBox.push({name: items[0], box: items[1]});
                    if (boxNames.indexOf(items[1]) === -1) {
                        boxNames.push(items[1]);
                    }
                });

                var idCount = 0; // temp id for games
                var games = [];
                boxNames.forEach(function (boxName) {
                    var boxPlayers = findPlayersInBox(playersAndBox, boxName);

                    if (boxPlayers.length !== 6) {
                        throw "Box " + name + " does not have the correct number of players";
                    }

                    // build the list of games from the players
                    for (var i = 0; i < 6; i++) {
                        for (var j = i + 1; j < 6; j++) {
                            var game = createGame(idCount.toString(),
                                findByName($rootScope.players, boxPlayers[i])._id,
                                findByName($rootScope.players, boxPlayers[i]),
                                findByName($rootScope.players, boxPlayers[j])._id,
                                findByName($rootScope.players, boxPlayers[j]),
                                $rootScope.boxleague.name,
                                $rootScope.boxleague._id,
                                boxName);

                            idCount++;
                            games.push(game);
                        }
                    }
                });

                // check if a play exists already in the array of games
                var findPlayer = function (games, player) {
                    for (var i = 0; i < games.length; i++) {
                        if (games[i].home === player || games[i].away === player) {
                            return true;
                        }
                    }
                    return false;
                };

                // create size distinct(players) game sets
                var findDistinct = function (games, size) {
                    var start = 0;
                    var results = [];
                    while (results.length !== size && start < games.length - 1) {
                        results = []; // reset
                        results.push(games[start++]);
                        for (var i = 0; i < games.length; i++) {
                            if (!findPlayer(results, games[i].home) && !findPlayer(results, games[i].away)) {
                                results.push(games[i]);
                                if (results.length === size) {
                                    return results;
                                }
                            }
                        }
                    }
                    throw "Could not find distinct games"
                };

                // return the difference between these arrays (what's left)
                var difference = function (a1, a2) {
                    var result = [];
                    var map = a2.map(function (item) {
                        return item._id
                    });
                    for (var i = 0; i < a1.length; i++) {
                        if (map.indexOf(a1[i]._id) === -1) {
                            result.push(a1[i]);
                        }
                    }
                    return result;
                };

                boxNames.forEach(function (boxName) {
                    var boxGames = findObjectsMatchingName(games, boxName);

                    // create 5 weeks of games of 3 games per week
                    var date = new Date($scope.startDate);
                    var toBePlayed = boxGames;
                    var newGames = [];
                    for (var i = 0; i < 5; i++) {
                        var tmp = findDistinct(toBePlayed, 3);
                        toBePlayed = difference(toBePlayed, tmp);
                        tmp.forEach(function (game) {
                            game.schedule = new Date(date);
                            newGames.push(game);
                        });
                        date.setDate(date.getDate() + 7);
                    }
                    boxGames = newGames;

                    var playerNames = [];
                    boxGames.forEach(function (game) {
                        if (playerNames.indexOf(game.home.name) === -1) {
                            playerNames.push(game.home.name);
                        }
                        if (playerNames.indexOf(game.away.name) === -1) {
                            playerNames.push(game.away.name);
                        }
                    });

                    var boxPlayers = [];
                    playerNames.forEach(function (player) {
                        boxPlayers.push(findByName($rootScope.players, player));
                    });

                    var box = {
                        name: boxName,
                        players: boxPlayers,
                        playerIds: boxPlayers.map(function (item) {
                            return item._id
                        }),
                        games: boxGames,
                        gameIds: boxGames.map(function (item) {
                            return item._id
                        })
                    };

                    $rootScope.boxleague.boxes.push(box);
                });
                $rootScope.games = games;
            });
        };

        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);

// parent control
boxleagueApp.controller('importPlayersCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersCtrl");

    $rootScope.alerts = [];

    $scope.currentPlayers = [];
    $scope.newPlayers = [];

    $http.get('/players').then(function (response) {
        $scope.currentPlayers = response.data;
        $scope.columns = filterColumns(getColumns($scope.currentPlayers));
    }, function (response) {
        $scope.currentPlayers = [];
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data
        });
    });

    $scope.sortType = 'name';    // set the default sort type
    $scope.sortReverse = false;  // set the default sort order
    $scope.searchName = '';      // set the default search/filter term
    $scope.type = 'player';      // set the default search/filter term
    $scope.toTitleCase = toTitleCase;
    $scope.sortColumn = function (column) {
        $scope.sortType = column;
        $scope.sortReverse = !$scope.sortReverse;
        return (column);
    };

    $scope.submit = function () {

        console.log("posting new player data ...");

        // clean data
        var data = [];
        $scope.newPlayers.forEach(function (player) {
            data.push({name: player.name, mobile: player.mobile, home: player.home, email: player.email});
        });

        $http.post('/players', JSON.stringify(data)).then(function (response) {
            $rootScope.alerts.push({type: "success", msg: "Players saved"});

            $http.get('/players').then(function (response) {
                $scope.currentPlayers = response.data;
            }, function (response) {
                $scope.currentPlayers = [];
                $rootScope.alerts.push({
                    type: "warning",
                    msg: "Read failed with error '" + response.data
                });
            });
        }, function (response) {
            $rootScope.alerts.push({
                type: "danger",
                msg: "Request failed with response '" + response.data + "' and status code: " + response.status
            });
        });

        $scope.newPlayers = [];
        $scope.currentPlayers = [];
    };
}]);
// control for file import
boxleagueApp.controller('importPlayersFileCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersFileCtrl");

    $scope.$watch('changeEvent', function () {
        if (!$scope.changeEvent) {
            return
        }

        $scope.filename = $scope.changeEvent.target.files[0].name;

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var line = data.split('\n');
                line.forEach(function (item) {
                    var details = item.split(',');
                    // skip if missing name
                    if (details[0].length === 0) {
                        return
                    }
                    var name = details[0];
                    var mobile = details[1];
                    var home = details[2];
                    var email = details[3];

                    var player = {name: name, mobile: mobile, home: home, email: email};

                    var currentMap = $scope.currentPlayers.map(function (x) {
                        return x.name
                    });
                    var newMap = $scope.newPlayers.map(function (x) {
                        return x.name
                    });

                    if (currentMap.indexOf(name) === -1 && newMap.indexOf(name) === -1) {
                        $scope.newPlayers.push(player);
                    }
                });
            });
        };
        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);
// control for Tim's spreadsheet import
boxleagueApp.controller('importPlayersXlsCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersXlsCtrl");

    $scope.$watch('changeEvent', function () {
        if (!$scope.changeEvent) {
            return
        }

        $scope.filename = $scope.changeEvent.target.files[0].name;

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});
                var content = XLSX.utils.sheet_to_csv(workbook.Sheets["Numbers"]);

                var matches = content.match(/([a-zA-Z' ]*),([0-9\\ ]*)/g);
                matches.forEach(function (item) {
                    var details = item.split(',');
                    // skip if missing content
                    if (details[0].length === 0 || details[1].length === 0) {
                        return
                    }
                    var name = details[0];
                    var mobile = details[1];
                    var player = {name: name, mobile: mobile};

                    var currentMap = $scope.currentPlayers.map(function (x) {
                        return x.name
                    });
                    var newMap = $scope.newPlayers.map(function (x) {
                        return x.name
                    });

                    if (currentMap.indexOf(name) === -1 && newMap.indexOf(name) === -1) {
                        $scope.newPlayers.push(player);
                    }
                });
            });
        };
        reader.readAsBinaryString($scope.changeEvent.target.files[0]);
    })
}]);
// control for manual input
boxleagueApp.controller('importPlayersManualCtrl', ['$scope', '$log', '$http', '$rootScope', function ($scope, $log, $http, $rootScope) {
    $log.info("importPlayersManualCtrl");

    $scope.data = {name: "", mobile: "", email: "", home: ""};

    $scope.add = function () {
        var newMap = $scope.newPlayers.map(function (item) {
            return item.name
        });
        var currentMap = $scope.currentPlayers.map(function (item) {
            return item.name
        });

        if (newMap.indexOf($scope.data.name) === -1 && currentMap.indexOf($scope.data.name) === -1) {
            $scope.newPlayers.push($scope.data);
        }
        $scope.data = {name: "", mobile: "", email: "", home: ""};
    }

    $scope.valid = function () {
        if ($scope.data.name.length < 3) {
            return false;
        }

        var newMap = $scope.newPlayers.map(function (item) {
            return item.name
        });
        var currentMap = $scope.currentPlayers.map(function (item) {
            return item.name
        });

        return (newMap.indexOf($scope.data.name) === -1 && currentMap.indexOf($scope.data.name) === -1);
    }
}]);