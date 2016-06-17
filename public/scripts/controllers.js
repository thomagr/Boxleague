function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
function removeColumn(array, name) {
    var index = array.indexOf(name);
    if (index !== -1) {
        array.splice(index, 1);
    }
    return array;
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
    columns.sort();
    // if column name appears make it the first one in the array
    if (columns.indexOf('name') !== -1) {
        columns.splice(columns.indexOf('name'), 1);
        columns.unshift('name');
    }
    return columns;
}
function filterColumns(columns) {
    var filter = [];
    // skip columns that contain these fields - used to make the output human readable
    var skip = ['Id', '_id', '_rev', '$$hashKey', 'boxes', "boxleague", "language", "views"];
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
function filterRowsTable(rows) {
    var filter = [];
    // skip rows that contain these fields - used to remove indexes
    var skip = ['language'];
    rows.forEach(function (row) {
        for (var i = 0; i < skip.length; i++) {
            if (row[skip[i]]) {
                return;
            }
        }
        filter.push(row);
    });
    return filter;
}
// function getDayClass(data) {
//     var date = data.date,
//         mode = data.mode;
//     if (mode === 'day') {
//         var dayToCheck = new Date(date).setHours(0, 0, 0, 0);
//
//         for (var i = 0; i < $scope.events.length; i++) {
//             var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);
//
//             if (dayToCheck === currentDay) {
//                 return $scope.events[i].status;
//             }
//         }
//     }
//
//     return '';
// }
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
function createBox(name, players, games) {

    check(name, "string");

    check(players, "array");
    check(players[0]._id, "string");

    check(games[0]._id, "string");
    check(games, "array");

    return {
        name: name,

        playerIds: players.map(function (item) {
            return item._id
        }),

        gameIds: games.map(function (item) {
            return item._id
        })
    }
}
function createGame(id, homePlayer, awayPlayer, boxleague, boxName, schedule) {

    check(id, "string");

    check(homePlayer, "object");
    check(homePlayer.name, "string");
    check(homePlayer._id, "string");

    check(awayPlayer, "object");
    check(awayPlayer.name, "string");
    check(awayPlayer._id, "string");

    check(boxleague, "object");
    check(boxleague.name, "string");
    check(boxleague._id, "string");

    check(boxName, "string");
    
    check(schedule, "Date");

    return {
        _id: id,

        // players
        homeId: homePlayer._id,
        // home: homeDetails.name,
        awayId: awayPlayer._id,
        // away: awayDetails.name,

        // boxleague
        boxleagueId: boxleague._id,

        // box
        box: boxName,
        
        schedule: schedule
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

function findObjectsMatchingBox(source, name) {
    var results = [];
    source.forEach(function (item) {
        if (item.box === name) {
            results.push(item);
        }
    });
    if (results.length === 0) {
        throw "Couldn't find item with box: " + name;
    }
    return results;
}
function findIdsMatchingName(source, name) {
    return findObjectsMatchingBox(source, name).map(function (item) {
        return item._id
    });
}

function findByProperty(source, property, value) {
    if (!source) {
        throw "No source provided";
    }

    if (!property) {
        throw "No property provided";
    }

    if (!value) {
        throw "No value provided";
    }

    for (var i = 0; i < source.length; i++) {
        if (source[i][property] === value) {
            return source[i];
        }
    }
    throw "Couldn't find object with property: " + property + " and value: " + value;
}
function findById(source, id) {
    return findByProperty(source, "_id", id);
}
function findByName(source, name) {
    return findByProperty(source, "name", name);
}

function unique(value, index, self) {
    return self.indexOf(value) === index;
}

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for (var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function scoreToSets(score) {
    var sets = [];

    // initialise $scope sets
    [1, 2, 3].forEach(function (set) {
        sets.push({name: "Set " + set, home: "0", away: "0"});
    });

    // load $scope sets from current score
    var arr = score ? score.split(" ") : [];
    for (var i = 0; i < arr.length; i++) {
        var games = arr[i].split(":");
        sets[i].home = games[0] || "0";
        sets[i].away = games[1] || "0";
    }
    return sets;
}
function setsToScore(sets) {
    var arr = sets.map(function(set) {
        return set.home + ":" + set.away;
    });

    var score = arr.join(" ");

    // fix score format
    // set to blank string if no score
    score = score.replace(/^0:0 0:0 0:0$/, "");
    // remove trailing 3rd set if no score
    score = score.replace(/ 0:0$/, "");
    // remove trailing 2nd set if walkover
    if(score.indexOf("W") !== -1){
        score = score.replace(/ 0:0$/, "");
    }
    // remove trailing 2nd set if concedes
    if(score.indexOf("C") !== -1){
        score = score.replace(/ 0:0$/, "");
    }

    return score;
}

// Do we have a valid values for a set score e.g. 6:0, 7:5, 7:6
function isSetScore(set) {
    if(!set || !set.length ){
        return 0;
    }

    var games = set.split(":");

    if (games.length !== 2) {
        return 0;
    }

    var home = parseInt(games[0]);
    var away = parseInt(games[1]);

    // if we have a 'C' then someone has conceded
    if(set.indexOf('C') !== -1) {
        // special situation for concedes
        if (set === "C:C") {
            return 0;
        }
        if ((games[0] === 'C' && away <= 7 && away >= 0) || (games[1] === 'C' && home <= 7 && home >= 0)) {
            return 1;
        }
        return 0;
    }

    // values are not in range
    if (home < 0 || away < 0) {
        return 0;
    }

    // score is not set
    if (home + away === 0) {
        return 0;
    }

    // values are not in range
    if (home > 7 || away > 7) {
        return 0;
    }

    // score is not set
    if (home < 6 && away < 6) {
        return 0;
    }

    // special case tiebreak set 7:6
    if (home + away === 13) {
        return 1;
    }

    // valid scores
    if ((home === 6 || away === 6) && Math.abs(home - away) >= 2) {
        return 1;
    }

    if ((home === 7 || away === 7) && Math.abs(home - away) === 2) {
        return 1;
    }

    return 0;
}
// Do we have a walkover
function isWalkover(set) {
    if (!set || !set.length) {
        return 0;
    }

    if (set === "W:0" || set === "0:W") {
        return 1;
    }
    return 0;
}
// Do we have valid values for a tiebreak e.g. 1:0 or 10:8
function isTiebreakScore(set, numPoints) {
    if(!set || !set.length ){
        return 0;
    }

    var games = set.split(":");

    if (games.length !== 2) {
        return 0;
    }

    var home = parseInt(games[0]);
    var away = parseInt(games[1]);

    if(set.indexOf('C') !== -1) {
        // special situation for concedes
        if (set === "C:C") {
            return 0;
        }
        if ((games[0] === 'C' && away <= numPoints && away >= 0) || (games[1] === 'C' && home <= numPoints && home >= 0)) {
            return 1;
        }
        return 0;
    }

    // negative values
    if(home < 0 || away < 0){
        return 0;
    }

    // score is not set
    if (home + away === 0) {
        return 0;
    }

    // special case valid final set score e.g. 1:0
    if (home + away === 1) {
        return 1;
    }

    // tiebreak is not set
    if (home < numPoints && away < numPoints) {
        return 0;
    }

    var diff = Math.abs(home - away);
    if (home === numPoints && home - away >= 2) {
        return 1;
    } else if (away === numPoints && away - home >= 2) {
        return 1;
    } else if (home > numPoints && diff === 2) {
        return 1;
    } else if (away > numPoints && diff === 2) {
        return 1;
    }

    return 0;
}
// Special case 10 point match tiebreak
function isMatchTiebreakScore(set) {
    return isTiebreakScore(set, 10);
}
// Do we have valid sequence of sets e.g. set1, set2 or set1, set2, match tiebreak
function isSetsSinglesScore(score, numSets) {
    if (!score || !score.length) {
        return 0;
    }

    // games in sets
    var sets = score.split(" ");

    if(!sets || !sets.length){
        return 0;
    }

    // check concedes logic
    var concedes = 0;
    sets.forEach(function(set){
        set.split(":").forEach(function(game){
            concedes += game === 'C';
        })
    });

    if(concedes){
        if(concedes > 1){
            return 0;
        }

        // check only the last set is a concedes and there is only 1 'C'
        if(sets[sets.length-1].indexOf('C') === -1) {
            return 0;
        }

        // who conceded?
        var sets = score.split(" ");
        sets.forEach(function(set){
            var games = set.split(":");
            if(games[0] === 'C'){
                isHome = true;
            }
        });
        // get rid of the last set
        sets.pop();
        // we shouldn't have a complete score if the last set is popped
        if(isCompleteScore(sets.join(" "), numSets)){
            return 0;
        }

        // add the winner of the next sets
        while(!isCompleteScore(sets.join(" "), numSets) && sets.length < 3){
            sets.push(isHome ? "0:6" : "6:0");
        }
        score = sets.join(" ");
    }

    var setsScores = 0;
    sets.forEach(function(set){
        setsScores += isSetScore(set);
    });
    // first set may be a walkover
    var walkover = isWalkover(sets[0]);
    // last set may be a match tiebreak
    var tieBreakScore = isMatchTiebreakScore(sets[sets.length-1]);

    // walkover
    if(walkover){
        return 1;
    }
    // we have all sets scores
    if (sets.length > 0 && sets.length === setsScores) {
        return 1;
    }
    // or sets scores with a final tiebreak
    if (sets.length === numSets && sets.length === setsScores + tieBreakScore) {
        return 1;
    }

    return 0;
}
// Has someone won
function isCompleteScore(score, numSets) {
    if (!score || !score.length) {
        return 0;
    }

    // if we have a 'C' then someone has conceded
    if(score.indexOf('C') !== -1 && score.indexOf('W') === -1){
        return 1;
    }

    if(isWalkover(score)){
        return 1;
    }

    var sets = score.split(" ");
    var home = 0;
    var away = 0;

    for(var i=0; i < sets.length; i++) {
        var games = sets[i].split(":");
        var homeWin = 0, awayWin = 0;
        if (parseValue(games[0]) > parseValue(games[1])) {
            homeWin++;
            home++;
        } else if (parseValue(games[0]) < parseValue(games[1])) {
            awayWin++;
            away++;
        }
        // check if we have a score after someone has already won
        if(awayWin && home === Math.ceil(numSets / 2)){
            return 0;
        } else if(homeWin && away === Math.ceil(numSets / 2)){
            return 0;
        }
    }

    // too many sets
    if(home + away > numSets){
        return 0;
    }

    // one side has won too many
    if(home === numSets || away === numSets){
        return 0;
    }

    // not enough sets
    if(home + away < Math.ceil(numSets / 2)){
        return 0;
    }

    // someone has won
    if(Math.abs(home - away) > 0) {
        return 1;
    }

    return 0;
}

function parseValue(str){
    return parseInt(str) || 0;
}
// calculate stats about the games, full games are counted not tiebreaks
function calculateGameStats(score) {
    var stats = {gamesHome: 0, gamesAway: 0};

    if(isWalkover(score)){
        return stats;
    }

    // C is equivalent to a zero score
    score.replace('C', '0');

    score.split(" ").forEach(function (set) {
        if(!isSetScore(set)){
            return;
        }
        var gameString = set.split(":");
        stats.gamesHome += parseValue(gameString[0]);
        stats.gamesAway += parseValue(gameString[1]);
    });

    return stats;
}
// calculate stats about the sets
function calculateSetsStats(score) {
    var stats = {setsHome: 0, setsAway: 0};

    if(isWalkover(score)){
        return stats;
    }

    // C is equivalent to a zero score
    score.replace('C', '0');

    score.split(" ").forEach(function (set) {
        if(!isSetScore(set) && !isMatchTiebreakScore(set)){
            return;
        }
        var gameString = set.split(":");
        var home = parseInt(gameString[0]);
        var away = parseInt(gameString[1]);
        if(home > away){
            stats.setsHome++;
        } else if( away > home){
            stats.setsAway++;
        }
    });

    return stats;
}
// calculate points from score
function calculatePoints(score, numSets) {
    var stats = {home: 0, away: 0, setsHome: 0, setsAway: 0, gamesHome: 0, gamesAway: 0};

    // points can only be allocated for complete and valid sets scores
    if (!isCompleteScore(score, numSets) || !isSetsSinglesScore(score, numSets)) {
        return stats;
    }

    // special situation for walkover
    if (score === "W:0") {
        stats.home = 10;
        return stats;
    } else if(score === "0:W"){
        stats.away = 10;
        return stats;
    }

    var gameStats = calculateGameStats(score);
    var setsStats = calculateSetsStats(score);

    // special situation for concedes, add the remaining sets for scoring
    var isConcedes = false;
    var isConcedesHome = false;
    if(score.indexOf('C') !== -1) {
        if (score.indexOf('C') !== -1) {
            isConcedes = true;
            // who conceded?
            var sets = score.split(" ");
            sets.forEach(function (set) {
                var games = set.split(":");
                if (games[0] === 'C') {
                    isConcedesHome = true;
                }
            });
            // get rid of the last conceded set
            sets.pop();
            // add the winner of the next sets
            while (!isCompleteScore(sets.join(" "), numSets) && sets.length < numSets) {
                sets.push(isConcedesHome ? "0:6" : "6:0");
            }
            score = sets.join(" ");
        }
    }

    var setsString = score.split(" ");

    var sets = [];
    setsString.forEach(function (set) {
        var gameString = set.split(":");
        sets.push([parseValue(gameString[0]), parseValue(gameString[1])]);
    });

    // the points
    var homePoints = 0, awayPoints = 0;
    // work out the sets score
    var homeSets = 0, awaySets = 0;
    sets.forEach(function(set) {
        if (set[0] > set[1]) {
            homeSets++;
        } else if (set[1] > set[0]) {
            awaySets++;
        }
    });

    //straight wins
    if(homeSets === 2 && awaySets === 0) {
        homePoints = 18;
        awayPoints = gameStats.gamesAway;
    } else if(awaySets === 2 && homeSets === 0) {
        homePoints = gameStats.gamesHome;
        awayPoints = 18;
    } else if(homeSets === 2 && awaySets === 1) {
        homePoints = 16;
        awayPoints = 8;
        for(var i=0;i<sets.length-1;i++){
            if (sets[i][0] > sets[i][1]) {
                awayPoints += sets[i][1];
            }
        }
    } else if(awaySets === 2 && homeSets === 1) {
        homePoints = 8;
        awayPoints = 16;
        for(var i=0;i<sets.length-1;i++){
            if (sets[i][0] < sets[i][1]) {
                homePoints += sets[i][0];
            }
        }
    }

    // if (sets.length === numSets - 1) {
    //     if (sets[0][0] > sets[0][1]) {
    //         setsHome = 2;
    //         home = 6 * numSets;
    //         away = gamesAway;
    //     } else {
    //         setsAway = 2;
    //         away = 18;
    //         home = gamesHome;
    //     }
    // } else if (sets.length === numSets) {
    //     if (sets[2][0] > sets[2][1]) {
    //         home = 12;
    //         setsHome = 2;
    //         setsAway = 1;
    //         away = gamesAway;
    //     } else {
    //         away = 12;
    //         setsAway = 2;
    //         setsHome = 1;
    //         home = gamesHome;
    //     }
    // }

    // concedes needs to give the winning player at least +2
    if(isConcedes && Math.abs(homePoints - awayPoints) < 2){
        if(isConcedesHome){
            homePoints = awayPoints - 2;
        } else {
            awayPoints = homePoints - 2;
        }
    }

    return {
        home: homePoints,
        away: awayPoints,
        setsHome: setsStats.setsHome,
        setsAway: setsStats.setsAway,
        gamesHome: gameStats.gamesHome,
        gamesAway: gameStats.gamesAway
    };
}

function calculateLeaderboard(games, players) {
    var leaderboard = [];
    var getRunningScore = function (player, box) {
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
            gamesFor: 0,
            gamesAgainst: 0,
            gamesDiff: 0,
            setsFor: 0,
            setsAgainst: 0,
            setsDiff: 0,
            box: box
        });
        return leaderboard[leaderboard.length - 1];
    };

    games.forEach(function (game) {

        var homePlayer = findById(players, game.homeId);
        var awayPlayer = findById(players, game.awayId);

        // skip any free week games
        if (homePlayer.name === "Free Week" || awayPlayer.name === "Free Week") {
            return;
        }

        // skip any injured players
        if (homePlayer.available === "no" || awayPlayer.available === "no") {
            return;
        }

        var home = getRunningScore(homePlayer.name, game.box);
        var away = getRunningScore(awayPlayer.name, game.box);

        var score = calculatePoints(game.score, 3);

        if (score.home > 0 || score.away > 0) {
            if(game.score.indexOf('W') ===-1 ) {
                home.played++;
                away.played++;
            }

            home.score += score.home;
            away.score += score.away;

            home.gamesFor += score.gamesHome;
            home.gamesAgainst += score.gamesAway;
            home.gamesDiff = home.gamesFor - home.gamesAgainst;

            away.gamesFor += score.gamesAway;
            away.gamesAgainst += score.gamesHome;
            away.gamesDiff = away.gamesFor - away.gamesAgainst;

            home.setsFor += score.setsHome;
            home.setsAgainst += score.setsAway;
            home.setsDiff = home.setsFor - home.setsAgainst;

            away.setsFor += score.setsAway;
            away.setsAgainst += score.setsHome;
            away.setsDiff = away.setsFor - away.setsAgainst;

            if(game.score.indexOf('W') ===-1 ) {
                if (score.home > score.away) {
                    home.won++;
                    away.lost++;
                } else {
                    away.won++;
                    home.lost++;
                }
            }
        }
    });

    return leaderboard;
}

function getActiveBoxleague($http, $rootScope, success, fail) {
    if($rootScope.activeBoxleague){
        success($rootScope.activeBoxleague);
    } else {
        $http.get('/boxleagues/yes').then(function (response) {
            if (response && response.data && response.data.length === 1) {
                success(response.data[0]);
            } else {
                fail({data: "No active boxleague found"});
            }
        }, function (response) {
            fail(response);
        });
    }
}

function getPlayers($http, $rootScope, success, fail) {
    if($rootScope.players){
        success($rootScope.players);
    } else {
        $http.get('players').then(function (response) {
            if (response && response.data && response.data.length) {
                $rootScope.players = response.data;
                success($rootScope.players);
            } else {
                fail({data: "No players found"});
            }
        }, function (response) {
            fail(response);
        });
    }
}

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
        $scope.rows = filterRowsTable(response.data);
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
boxleagueApp.controller('formCtrl', ['$scope', '$log', '$http', '$rootScope', '$routeParams', '$location', function ($scope, $log, $http, $rootScope, $routeParams, $location) {
    $log.info("formCtrl");

    var table = $routeParams.name;
    var id = $routeParams.id;

    if (table === "boxleague" && !$rootScope.admin) {
        $location.url('/boxleague/' + id + '/boxes');
        return;
    }

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

    // get the specific object
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

    $scope.columnType = function (column) {
        var type = "string";
        switch (column) {
            case "active":
                type = "yesno";
                break;
            case "available":
                type = "noblank";
        }
        return type;
    };

    // action buttons
    $scope.submit = function () {
        console.log("saving data ...");

        // clean data before save
        var data = $scope.data;
        data = clone(data);
        delete data["$$hashKey"];
        if(data.available && data.available === "yes")
            delete data.available;

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

    // don't allow player names to change
    $scope.readOnly = function (column) {
        return table === "player" && column === "name"
    }
}]);
boxleagueApp.controller('settingsMainCtrl', ['$scope', '$log', '$rootScope', '$location', '$http', function ($scope, $log, $rootScope, $location, $http) {
    $log.info("settingsMainCtrl");

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
boxleagueApp.controller('myBoxMainCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', '$timeout', function ($scope, $rootScope, $log, $location, $http, $timeout) {
    $log.info("myBoxMainCtrl");

    $scope.loading = true;
    $scope.login = $rootScope.login;

    var error = function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
        $scope.loading = false;
    };

    getActiveBoxleague($http, $rootScope, function (boxleague) {
        $scope.boxleague = boxleague;
        getPlayers($http, $rootScope, function (players) {
            $scope.players = players;
            var found = false;
            var loginId = findByName($scope.players, $rootScope.login)._id;
            $scope.boxleague.boxes.forEach(function (box) {
                if (box.playerIds.indexOf(loginId) !== -1) {
                    found = true;
                    $location.url('/boxleague/' + boxleague._id + '/box/' + box.name);
                }
            });
            if (!found) {
                $scope.loading = false;
            }
        }, error);
    }, error);
}]);
boxleagueApp.controller('scoreboardCtrl', function ($scope, $log, $uibModalInstance, game) {
    $log.info("scoreboardCtrl");

    // initialise scope values from parameters
    $scope.score = game.score;
    $scope.home = game.home;
    $scope.away = game.away;

    // fix type of date
    if (game.date instanceof Date) {
        $scope.date = game.date;
    } else if (typeof game.date == "string" && game.date.length) {
        $scope.date = new Date(game.date);
    } else {
        $scope.date = game.date;
    }

    // for efficient handling of checks
    $scope.dirty = true;
    $scope.valid = false;
    $scope.validScore = function (sets) {
        if($scope.dirty){
            var score = setsToScore(sets);
            $scope.valid = score === "" || (isSetsSinglesScore(score, 3) && isCompleteScore(score, 3));
            var points = calculatePoints(score, 3);
            $scope.homePoints = points.home;
            $scope.awayPoints = points.away;
            $scope.dirty = false;
        }
        return $scope.valid;
    };

    // for + and - buttons
    $scope.decrement = function (score, index) {
        $scope.dirty = true;

        if(index === 0 && score === "C" || score === "W"){
            return 'W';
        }
        if(score === "0" || score === "C"){
            return 'C';
        }
        var num = parseInt(score);
        num = Math.max(0, num - 1);

        return num.toString();
    };
    $scope.increment = function (score, index) {
        $scope.dirty = true;

        if(index === 0 && score === "W"){
            return 'C';
        }
        if(score === "C"){
            return '0';
        }
        var num = parseInt(score);
        var max = index === 2 ? 99 : 7;
        num = Math.min(max, num + 1);

        return num.toString();
    };

    // main panel buttons
    $scope.ok = function () {
        game.score = cleanScore(setsToScore($scope.sets));
        game.date = $scope.date;

        $uibModalInstance.close(game);
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss(null);
    };
    $scope.reset = function () {
        $scope.score = "";
        $scope.date = "";
        $scope.dirty = true;
        $scope.sets = scoreToSets($scope.score);
    };
    $scope.update = function () {
        $scope.score = setsToScore($scope.sets);
    };


    // For Dates dialog
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.inlineOptions = {
        //customClass: getDayClass,
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

    // initialise
    $scope.sets = scoreToSets($scope.score);
});
boxleagueApp.controller('boxleagueCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', function ($scope, $rootScope, $log, $location, $http) {
    $log.info("boxleagueCtrl");

    getActiveBoxleague($http, $rootScope, function (boxleague) {
        boxleague.boxes.forEach(function (box) {
            $location.url('/boxleague/' + boxleague._id + '/boxes');
        });
    }, function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
    });
}]);
boxleagueApp.controller('boxesCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', function ($scope, $log, $resource, $routeParams, $rootScope, $http) {
    $log.info("boxesCtrl");

    $scope.playerLookup = function(id){
        return findById($scope.players, id).name;
    };

    $scope.id = $routeParams.id;

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read boxleague failed with error '" + response.data
        });
    };

    $http.get('/players').then(function (response) {
        $scope.players = response.data;

        $http.get('/boxleague/' + $scope.id).then(function (response) {
        $scope.boxleague = response.data;
        // for fixing when importing
        delete $rootScope.boxleague;
        }, error);
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
    $scope.notAvailable = [];

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data
        });
    };

    var setUpBox = function () {

        $scope.box = findByName($scope.boxleague.boxes, $scope.boxName);

        // update the box information for players
        $scope.box.players = [];
        $scope.box.playerIds.forEach(function (id) {
            $scope.box.players.push(findById($scope.players, id));
        });

        // update the box information for games
        $scope.box.games = [];
        $scope.box.gameIds.forEach(function (id) {
            $scope.box.games.push(findById($scope.games, id));
        });

        // update the player information for games
        $scope.box.games.forEach(function(game){
            game.home = findById($scope.players, game.homeId).name;
            game.away = findById($scope.players, game.awayId).name;
        });

        // create the notAvailable list
        $scope.box.players.forEach(function (player) {
            if (player.available === "no") {
                $scope.notAvailable.push(player.name);
            }
        });

        $scope.boxPlayers = $scope.box.players;
        $scope.boxGames = $scope.box.games;

        $scope.tableHeaders = [];
        $scope.tableRows = [];
        $scope.tableHeaders.push($scope.box.name);

        // calculate the leaderboard details
        $scope.leaderboard = calculateLeaderboard($scope.boxGames, $scope.players);
        var total = 0, played = 0;
        $scope.boxGames.forEach(function (game) {
            total++;
            if (isCompleteScore(game.score, 3) && isSetsSinglesScore(game.score, 3)) {
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

    if($rootScope.boxleague){
        $scope.boxleague = $rootScope.boxleague;
        $scope.players = $rootScope.players;
        $scope.games = $rootScope.games;
        setUpBox();
    } else {
        $http.get('/boxleague/' + $scope.id).then(function (response) {
            $scope.boxleague = response.data;
            $http.get('/players').then(function (response) {
                $scope.players = response.data;
                $http.get('/games/boxleagueId/' + $scope.id).then(function (response) {
                    $scope.games = response.data;
                    setUpBox();
                }, error)
            }, error);
        }, error);
    }

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
        if ($scope.boxleague.active === "no"){
            return true;
        }
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

    $scope.isNotAvailable = function (column, row, index) {
        if (index === 0) {
            for (var i = 0; i < $scope.notAvailable.length; i++) {
                if ($scope.notAvailable[i] === row[index]) {
                    return true;
                }
            }
        } else {
            for (i = 0; i < $scope.notAvailable.length; i++) {
                if ($scope.notAvailable[i] === row[index].home || $scope.notAvailable[i] === row[index].away) {
                    return true;
                }
            }
        }
        return false;
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
        if (row[index].game.home === row[index].home) {
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

        var validSetsScore = isSetsSinglesScore(game.score, 3);
        if (!validSetsScore) {
            game.error = "!";
            return;
        }

        var validCompleteScore = isCompleteScore(game.score, 3);
        if (!validCompleteScore) {
            game.error = "*";
            return;
        }

        if (validStr && validSetsScore && validCompleteScore) {
            game.save = true;
        }
    };
}]);
boxleagueApp.controller('leaderboardMainCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', function ($scope, $rootScope, $log, $location, $http) {
    $log.info("leaderboardMainCtrl");

    getActiveBoxleague($http, $rootScope, function (boxleague) {
        $location.url('/boxleague/' + boxleague._id + '/leaderboard');
    }, function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
    });
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
        $http.get('/players').then(function (response) {
            $scope.players = response.data;
            $http.get('/games/boxleagueId/' + $scope.id).then(function (response) {
                $scope.games = response.data;
                $scope.leaderboard = calculateLeaderboard($scope.games, $scope.players);
                var total = 0, played = 0;
                $scope.games.forEach(function (game) {
                    total++;
                    if (isCompleteScore(game.score, 3) && isSetsSinglesScore(game.score, 3)) {
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
    }, error);
}]);
boxleagueApp.controller('nextBoxleagueCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$filter', function ($scope, $log, $resource, $routeParams, $rootScope, $http, $filter) {
    $log.info("nextBoxleagueCtrl");

    var error = function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
    };

    getActiveBoxleague($http, $rootScope, function (boxleague) {
        $scope.boxleague = boxleague;

        $http.get('/games/boxleagueId/' + boxleague._id).then(function (response) {
            $scope.games = response.data;
            $http.get('/players').then(function (response) {
                $scope.players = response.data;
                nextBoxleague($scope.boxleague, $scope.games, $scope.players)
            }, error);
        }, error);
    }, error);

    var nextBoxleague = function (boxleague, games, players) {
        $scope.leaderboard = calculateLeaderboard(games, players);
        $scope.leaderboard = $filter('orderBy')($scope.leaderboard, ['-box', 'score', 'setsDiff', 'gamesDiff', '-name'], true);

        // update the box information for players
        $scope.currentPlayers = [];
        boxleague.boxes.forEach(function (box) {
            box.playerIds.forEach(function (id) {
                $scope.currentPlayers.push(findById(players, id));
            });
        });
        $scope.currentPlayers.sort();

        $scope.nextBox = [];

        var boxNames = $scope.leaderboard.map(function (item) {
            return item.box
        });

        boxNames = boxNames.filter(unique);
        boxNames = boxNames.sort();
        $scope.boxNames = boxNames;

        for (var i = 0; i < boxNames.length; i++) {
            var current = boxNames[i];
            var above = boxNames[Math.max(0, i - 1)];
            var below = boxNames[Math.min(boxNames.length - 1, i + 1)];

            var box = findObjectsMatchingBox($scope.leaderboard, current);
            box.forEach(function (item) {
                item.newBox = current;
                item.box = current;
            });

            // promote
            var j = 0;
            box[j].newBox = above;
            box[j].change = box[j].box !== box[j].newBox ? "promote" : "";
            j++;
            box[j].newBox = above;
            box[j].change = box[j].box !== box[j].newBox ? "promote" : "";

            // demote
            j = box.length - 2;
            box[j].newBox = below;
            box[j].change = box[j].box !== box[j].newBox ? "demote" : "";
            j++;
            box[j].newBox = below;
            box[j].change = box[j].box !== box[j].newBox ? "demote" : "";

            box.forEach(function (item) {
                $scope.nextBox.push(item);
            })
        }
    };

    $scope.removed = [];
    $scope.remove = function () {
        $scope.nextBox.splice(arrayObjectIndexOf($scope.nextBox, $scope.removeSelected.name, 'name'), 1);
        $scope.removed.push($scope.removeSelected);
    };

    $scope.added = [];
    $scope.add = function () {
        $scope.nextBox.push({name: $scope.playerSelected.name, newBox: $scope.boxSelected, change: 'added'});
        $scope.added.push($scope.playerSelected);

    };
}]);
boxleagueApp.controller('headToHeadCtrl', ['$scope', '$log', '$rootScope', '$location', '$http', function ($scope, $log, $rootScope, $location, $http) {
    $log.info("headToHeadCtrl");

    var error = function (response) {
        $rootScope.alerts.push({
            type: "warning",
            msg: "Read failed with error '" + response.data
        });
    };

    $scope.login = $rootScope.login;

    // get all of the required data
    $http.get('/boxleagues').then(function (response) {
        $scope.boxleagues = response.data;
        $http.get('/players').then(function (response) {
            $scope.players = response.data;
            $http.get('/games/homeId/' + findByName($scope.players, $rootScope.login)._id).then(function (response) {
                $scope.games = response.data;
                $http.get('/games/awayId/' + findByName($scope.players, $rootScope.login)._id).then(function (response) {
                    $scope.games.concat(response.data);
                    setUp();
                }, error);
            }, error);
        }, error);
    }, error);

    var setUp = function () {
        var login = findByName($scope.players, $rootScope.login);
        var loginId = login._id;

        var hasScore = [];
        var played = [];
        $scope.games.forEach(function (game) {
            var index = arrayObjectIndexOf($scope.boxleagues, game.boxleagueId, "_id");
            game.boxleague = $scope.boxleagues[index].name;
            if (game.score && game.score.length) {
                hasScore.push(game);
                if (game.homeId !== loginId) {
                    played.push(findById($scope.players, game.homeId));
                }
                if (game.awayId !== loginId) {
                    played.push(findById($scope.players, game.awayId));
                }
            }
        });
        played = played.map(function(item){return item._id});
        played = played.filter(unique);
        played = played.map(function(item){return findById($scope.players, item)});

        $scope.games = hasScore;
        $scope.played = played;

        $scope.columns = ["date", "home", "away", "boxleague", "box", "score"];
        $scope.sortType = "date";
        $scope.sortReverse = false;
        $scope.searchName = "";
        //$scope.type = "game";
        $scope.toTitleCase = toTitleCase;
        $scope.sortBoxColumn = function (column) {
            $scope.sortType = column;
            $scope.sortReverse = !$scope.sortReverse;
            return (column);
        };
    };
    $scope.change = function (selected) {
        var games = [];

        $scope.games.forEach(function (game) {
            if (game.homeId === $scope.selected._id) {
                games.push(game);
            }
            if (game.awayId === $scope.selected._id) {
                games.push(game);
            }
        });

        $scope.searchName = selected.name;

        $scope.leaderboard = calculateLeaderboard(games, $scope.players);
    }
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
                            findByName($rootScope.players, players[0]),
                            findByName($rootScope.players, players[1]),
                            $rootScope.boxleague.name,
                            $rootScope.boxleague._id,
                            boxName,
                            new Date);

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

    $scope.playerLookup = function(id){
        return findById($scope.players, id).name;
    };

    var error = function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
    };

    getPlayers($http, $rootScope, function (players) {
        $scope.players = players;
        if(!$rootScope.boxleague) {
            $scope.boxleague = {};
            $scope.boxleague.name = "Import";
            $scope.boxleague.start = new Date;
            $scope.boxleague.end = new Date;
        } else {
            $scope.boxleague = $rootScope.boxleague;
        }
    }, error);

    $scope.changeEvent = "";
    $scope.filename = "";

    // For Dates dialog
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.inlineOptions = {
        // customClass: getDayClass,
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
        //var boxleague = createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        $rootScope.saveImportedBoxleague($rootScope.boxleague, $rootScope.games, $rootScope.players);
    };

    $scope.$watch('changeEvent', function () {
        if (!$scope.changeEvent) {
            return
        }

        $scope.filename = $scope.changeEvent.target.files[0].name;
        $scope.games = [];

        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function () {
                var data = evt.target.result;

                $scope.boxleague = createBoxleague("0", $scope.boxleague.name, $scope.boxleague.start, $scope.boxleague.end, []);

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
                        var msg = "Box " + name + " does not have the correct number of players";
                        error({data: msg});
                        throw msg;
                    }

                    // build the list of games from the players
                    for (var i = 0; i < 6; i++) {
                        for (var j = i + 1; j < 6; j++) {
                            var game = createGame(idCount.toString(),
                                findByName($scope.players, boxPlayers[i]),
                                findByName($scope.players, boxPlayers[j]),
                                $scope.boxleague,
                                boxName);

                            idCount++;
                            games.push(game);
                        }
                    }
                });

                // check if a player exists already in the array of games
                var findPlayer = function (games, Id) {
                    for (var i = 0; i < games.length; i++) {
                        if (games[i].homeId === Id || games[i].awayId === Id) {
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
                            if (!findPlayer(results, games[i].homeId) && !findPlayer(results, games[i].awayId)) {
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
                    var boxGames = findObjectsMatchingBox(games, boxName);

                    // create 5 weeks of games of 3 games per week
                    var date = new Date($scope.boxleague.start);
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

                    var playerIds = [];
                    boxGames.forEach(function (game) {
                        if (playerIds.indexOf(game.homeId) === -1) {
                            playerIds.push(game.homeId);
                        }
                        if (playerIds.indexOf(game.awayId) === -1) {
                            playerIds.push(game.awayId);
                        }
                    });

                    var boxPlayers = [];
                    playerIds.forEach(function (id) {
                        boxPlayers.push(findById($scope.players, id));
                    });

                    var box = createBox(boxName, boxPlayers, boxGames);
                    $scope.boxleague.boxes.push(box);
                });

                // copy to the rootScope
                $rootScope.boxleague = $scope.boxleague;
                $rootScope.players = $scope.players;
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

        $http.post('/players', JSON.stringify(data)).then(function () {
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
boxleagueApp.controller('importPlayersFileCtrl', ['$scope', '$log', function ($scope, $log) {
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
boxleagueApp.controller('importPlayersXlsCtrl', ['$scope', '$log', function ($scope, $log) {
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
boxleagueApp.controller('importPlayersManualCtrl', ['$scope', '$log', function ($scope, $log) {
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
    };

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

