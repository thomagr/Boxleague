// SERVICES
boxleagueApp.factory('commonService', function () {
    var root = {};

    root.check = function (object, type) {
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
    };

    root.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    root.getColumns = function (rows) {
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
    };

    root.arraySplice = function (array, name) {
        var index = array.indexOf(name);
        if (index !== -1) {
            array.splice(index, 1);
        }
        return array;
    };

    root.filterColumns = function (columns) {
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
    };

    root.filterRows = function (rows) {
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
    };

    root.findObjectsMatchingBox = function (source, box) {

        if (!source) {
            throw "no source provided";
        }

        if (!box) {
            throw "no box provided";
        }

        root.check(source, "array");

        var results = [];
        source.forEach(function (item) {
            if (item.box === box) {
                results.push(item);
            }
        });
        if (results.length === 0) {
            throw ("Could not find item with box: " + box);
        }
        return results;
    };

    root.findIdsMatchingName = function (source, name) {
        return root.findObjectsMatchingBox(source, name).map(function (item) {
            return item._id
        });
    };

    root.findByProperty = function (source, property, value) {
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
    };

    root.findById = function (source, id) {
        return root.findByProperty(source, "_id", id);
    };

    root.findByName = function (source, name) {
        return root.findByProperty(source, "name", name);
    };

    root.unique = function (value, index, self) {
        return self.indexOf(value) === index;
    };

    root.arrayObjectIndexOf = function (myArray, searchTerm, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    };

    root.parseValue = function (str) {
        return parseInt(str) || 0;
    };

    return root;
});
boxleagueApp.factory('tennisService', function (commonService) {
    var root = {};

    // create code objects
    root.createBoxleague = function (id, name, start, end, boxes) {

        commonService.check(id, "string");
        commonService.check(name, "string");
        commonService.check(start, "Date");
        commonService.check(end, "Date");
        commonService.check(boxes, "array");

        return {
            _id: id,

            name: name,

            // dates
            start: start,
            end: end,

            // boxes
            boxes: boxes
        }
    };
    root.createBox = function (name, players, games) {

        commonService.check(name, "string");

        commonService.check(players, "array");
        commonService.check(players[0]._id, "string");

        commonService.check(games[0]._id, "string");
        commonService.check(games, "array");

        return {
            name: name,

            playerIds: players.map(function (item) {
                return item._id
            }),

            gameIds: games.map(function (item) {
                return item._id
            })
        }
    };
    root.createGame = function (id, homePlayer, awayPlayer, boxleague, boxName, schedule) {

        commonService.check(id, "string");

        commonService.check(homePlayer, "object");
        commonService.check(homePlayer.name, "string");
        commonService.check(homePlayer._id, "string");

        commonService.check(awayPlayer, "object");
        commonService.check(awayPlayer.name, "string");
        commonService.check(awayPlayer._id, "string");

        commonService.check(boxleague, "object");
        commonService.check(boxleague.name, "string");
        commonService.check(boxleague._id, "string");

        commonService.check(boxName, "string");

        commonService.check(schedule, "Date");

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
    };

    // scores shouldn't have 0:0 or unwanted spaces
    root.cleanScore = function (score) {
        if (!score) {
            return "";
        }

        commonService.check(score, "string");

        score = score.replace(/0:0/g, "");
        score = score.replace(/  /g, " ");
        score = score.trim();

        return score;
    };

    // convert from string to array
    root.scoreToSets = function (score) {
        var sets = [];

        // initialise $scope sets
        [1, 2, 3].forEach(function (set) {
            sets.push({name: "Set " + set, home: "0", away: "0"});
        });

        if (!score) {
            return sets;
        }

        commonService.check(score, "string");

        // load $scope sets from current score
        var arr = score ? score.split(" ") : [];
        for (var i = 0; i < arr.length; i++) {
            var games = arr[i].split(":");
            sets[i].home = games[0] || "0";
            sets[i].away = games[1] || "0";
        }
        return sets;
    };
    // convert from array to valid string
    root.setsToScore = function (sets) {
        if (!sets) {
            return "";
        }

        commonService.check(sets, "array");

        var arr = sets.map(function (set) {
            return set.home + ":" + set.away;
        });

        var score = arr.join(" ");

        // fix score format
        // set to blank string if no score
        score = score.replace(/^0:0 0:0 0:0$/, "");
        // remove trailing 3rd set if no score
        score = score.replace(/ 0:0$/, "");
        // remove trailing 2nd set if walkover
        if (score.indexOf("W") !== -1) {
            score = score.replace(/ 0:0$/, "");
        }
        // remove trailing 2nd set if concedes
        if (score.indexOf("C") !== -1) {
            score = score.replace(/ 0:0$/, "");
        }

        return score;
    };

    // do we have a valid values for a set score e.g. 6:0, 7:5, 7:6
    root.isSetScore = function (setString) {
        if (!setString) {
            return 0;
        }

        commonService.check(setString, "string");

        var games = setString.split(":");

        if (games.length !== 2) {
            return 0;
        }

        var home = parseInt(games[0]);
        var away = parseInt(games[1]);

        // if we have a 'C' then someone has conceded
        if (setString.indexOf('C') !== -1) {
            // special situation for concedes
            if (setString === "C:C") {
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
    };
    // do we have a walkover
    root.isWalkover = function (setString) {
        if (!setString) {
            return 0;
        }

        commonService.check(setString, "string");

        if (setString === "W:0" || setString === "0:W") {
            return 1;
        }
        return 0;
    };
    // do we have valid values for a tiebreak e.g. 1:0 or 10:8
    root.isTiebreakScore = function (setString, numPoints) {
        if (!setString) {
            return 0;
        }

        commonService.check(setString, "string");

        var games = setString.split(":");

        if (games.length !== 2) {
            return 0;
        }

        var home = parseInt(games[0]);
        var away = parseInt(games[1]);

        if (setString.indexOf('C') !== -1) {
            // special situation for concedes
            if (setString === "C:C") {
                return 0;
            }
            if ((games[0] === 'C' && away <= numPoints && away >= 0) || (games[1] === 'C' && home <= numPoints && home >= 0)) {
                return 1;
            }
            return 0;
        }

        // negative values
        if (home < 0 || away < 0) {
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
    };
    // special case 10 point match tiebreak
    root.isMatchTiebreakScore = function (setString) {
        return root.isTiebreakScore(setString, 10);
    };
    // do we have valid sequence of sets e.g. set1, set2 or set1, set2, match tiebreak
    root.isSetsSinglesScore = function (score, numSets) {
        if (!score) {
            return 0;
        }

        commonService.check(score, "string");

        // games in sets
        var sets = score.split(" ");

        if (!sets || !sets.length) {
            return 0;
        }

        // check concedes logic
        var concedes = 0;
        sets.forEach(function (set) {
            set.split(":").forEach(function (game) {
                concedes += game === 'C';
            })
        });

        if (concedes) {
            if (concedes > 1) {
                return 0;
            }

            // check only the last set is a concedes and there is only 1 'C'
            if (sets[sets.length - 1].indexOf('C') === -1) {
                return 0;
            }

            // who conceded?
            var isHome = false;
            sets.forEach(function (set) {
                var games = set.split(":");
                if (games[0] === 'C') {
                    isHome = true;
                }
            });
            // get rid of the last set
            sets.pop();
            // we shouldn't have a complete score if the last set is popped
            if (root.isCompleteScore(sets.join(" "), numSets)) {
                return 0;
            }

            // add the winner of the next sets
            while (!root.isCompleteScore(sets.join(" "), numSets) && sets.length < 3) {
                sets.push(isHome ? "0:6" : "6:0");
            }
        }

        var setsScores = 0;
        sets.forEach(function (set) {
            setsScores += root.isSetScore(set);
        });
        // first set may be a walkover
        var walkover = root.isWalkover(sets[0]);
        // last set may be a match tiebreak
        var tieBreakScore = root.isMatchTiebreakScore(sets[sets.length - 1]);

        // walkover
        if (walkover) {
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
    };
    // has someone won
    root.isCompleteScore = function (score, numSets) {
        if (!score) {
            return 0;
        }

        commonService.check(score, "string");

        // if we have a 'C' then someone has conceded
        if (score.indexOf('C') !== -1 && score.indexOf('W') === -1) {
            return 1;
        }

        if (root.isWalkover(score)) {
            return 1;
        }

        var sets = score.split(" ");
        var home = 0;
        var away = 0;

        for (var i = 0; i < sets.length; i++) {
            var games = sets[i].split(":");
            var homeWin = 0, awayWin = 0;
            if (commonService.parseValue(games[0]) > commonService.parseValue(games[1])) {
                homeWin++;
                home++;
            } else if (commonService.parseValue(games[0]) < commonService.parseValue(games[1])) {
                awayWin++;
                away++;
            }
            // check if we have a score after someone has already won
            if (awayWin && home === Math.ceil(numSets / 2)) {
                return 0;
            } else if (homeWin && away === Math.ceil(numSets / 2)) {
                return 0;
            }
        }

        // too many sets
        if (home + away > numSets) {
            return 0;
        }

        // one side has won too many
        if (home === numSets || away === numSets) {
            return 0;
        }

        // not enough sets
        if (home + away < Math.ceil(numSets / 2)) {
            return 0;
        }

        // someone has won
        if (Math.abs(home - away) > 0) {
            return 1;
        }

        return 0;
    };

    // calculate stats about the games, full games are counted not tiebreaks
    root.calculateGameStats = function (score) {
        var stats = {gamesHome: 0, gamesAway: 0};

        if (!score) {
            return stats;
        }

        commonService.check(score, "string");

        if (root.isWalkover(score)) {
            return stats;
        }

        // C is equivalent to a zero score
        score.replace('C', '0');

        score.split(" ").forEach(function (set) {
            if (!root.isSetScore(set)) {
                return;
            }
            var gameString = set.split(":");
            stats.gamesHome += commonService.parseValue(gameString[0]);
            stats.gamesAway += commonService.parseValue(gameString[1]);
        });

        return stats;
    };
    // calculate stats about the sets
    root.calculateSetsStats = function (score) {
        var stats = {setsHome: 0, setsAway: 0};

        if (!score) {
            return stats;
        }

        commonService.check(score, "string");

        if (root.isWalkover(score)) {
            return stats;
        }

        // C is equivalent to a zero score
        score.replace('C', '0');

        score.split(" ").forEach(function (set) {
            if (!root.isSetScore(set) && !root.isMatchTiebreakScore(set)) {
                return;
            }
            var gameString = set.split(":");
            var home = parseInt(gameString[0]);
            var away = parseInt(gameString[1]);
            if (home > away) {
                stats.setsHome++;
            } else if (away > home) {
                stats.setsAway++;
            }
        });

        return stats;
    };
    // calculate points from score
    root.calculatePoints = function (score, numSets) {
        var stats = {home: 0, away: 0, setsHome: 0, setsAway: 0, gamesHome: 0, gamesAway: 0};

        if (!score) {
            return stats;
        }

        commonService.check(score, "string");

        // points can only be allocated for complete and valid sets scores
        if (!root.isCompleteScore(score, numSets) || !root.isSetsSinglesScore(score, numSets)) {
            return stats;
        }

        // special situation for walkover
        if (score === "W:0") {
            stats.home = 10;
            return stats;
        } else if (score === "0:W") {
            stats.away = 10;
            return stats;
        }

        var gameStats = root.calculateGameStats(score);
        var setsStats = root.calculateSetsStats(score);

        // special situation for concedes, add the remaining sets for scoring
        var isConcedes = false;
        var isConcedesHome = false;
        var sets = [];
        if (score.indexOf('C') !== -1) {
            if (score.indexOf('C') !== -1) {
                isConcedes = true;
                // who conceded?
                sets = score.split(" ");
                sets.forEach(function (set) {
                    var games = set.split(":");
                    if (games[0] === 'C') {
                        isConcedesHome = true;
                    }
                });
                // get rid of the last conceded set
                sets.pop();
                // add the winner of the next sets
                while (!root.isCompleteScore(sets.join(" "), numSets) && sets.length < numSets) {
                    sets.push(isConcedesHome ? "0:6" : "6:0");
                }
                score = sets.join(" ");
            }
        }

        var setsString = score.split(" ");

        sets = [];
        setsString.forEach(function (set) {
            var gameString = set.split(":");
            sets.push([commonService.parseValue(gameString[0]), commonService.parseValue(gameString[1])]);
        });

        // the points
        var homePoints = 0, awayPoints = 0;
        // work out the sets score
        var homeSets = 0, awaySets = 0;
        sets.forEach(function (set) {
            if (set[0] > set[1]) {
                homeSets++;
            } else if (set[1] > set[0]) {
                awaySets++;
            }
        });

        //straight wins
        if (homeSets === 2 && awaySets === 0) {
            homePoints = 18;
            awayPoints = gameStats.gamesAway;
        } else if (awaySets === 2 && homeSets === 0) {
            homePoints = gameStats.gamesHome;
            awayPoints = 18;
        } else if (homeSets === 2 && awaySets === 1) {
            homePoints = 16;
            awayPoints = 8;
            for (var i = 0; i < sets.length - 1; i++) {
                if (sets[i][0] > sets[i][1]) {
                    awayPoints += sets[i][1];
                }
            }
        } else if (awaySets === 2 && homeSets === 1) {
            homePoints = 8;
            awayPoints = 16;
            for (var j = 0; j < sets.length - 1; j++) {
                if (sets[j][0] < sets[j][1]) {
                    homePoints += sets[j][0];
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
        if (isConcedes && Math.abs(homePoints - awayPoints) < 2) {
            if (isConcedesHome) {
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
    };
    root.calculateLeaderboard = function (games, players) {
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

            var homePlayer = commonService.findById(players, game.homeId);
            var awayPlayer = commonService.findById(players, game.awayId);

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

            var score = root.calculatePoints(game.score, 3);

            if (score.home > 0 || score.away > 0) {
                if (game.score.indexOf('W') === -1) {
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

                if (game.score.indexOf('W') === -1) {
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
    };

    return root;
});
boxleagueApp.factory('httpService', function ($rootScope, $http, commonService, tennisService) {
    var root = {};

    root.getError = function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: "Getting boxleague data failed: " + response.data
        });
    };

    root.getActiveBoxleague = function (success) {
        if ($rootScope.activeBoxleague) {
            success($rootScope.activeBoxleague);
        } else {
            $http.get('/boxleagues/yes').then(function (response) {
                if (response && response.data && response.data.length === 1) {
                    success(response.data[0]);
                } else {
                    root.getError({data: "No active boxleague found"});
                }
            }, root.getError);
        }
    };

    root.getPlayers = function (success) {
        if ($rootScope.playersCache) {
            success($rootScope.playersCache);
        } else {
            $http.get('players').then(function (response) {
                if (response && response.data && response.data.length) {
                    $rootScope.playersCache = response.data;
                    success($rootScope.playersCache);
                } else {
                    root.getError({data: "No players found"});
                }
            }, root.getError);
        }
    };

    root.getBoxleagues = function (success) {
        if ($rootScope.boxleaguesCache) {
            success($rootScope.boxleaguesCache);
        } else {
            $http.get('boxleagues').then(function (response) {
                if (response && response.data && response.data.length) {
                    $rootScope.boxleaguesCache = response.data;
                    success($rootScope.boxleaguesCache);
                } else {
                    root.getError({data: "No boxleagues found"});
                }
            }, root.getError);
        }
    };

    root.getBoxleague = function (id, success) {
        $rootScope.boxleagueIdCache = $rootScope.boxleagueIdCache || {};
        if ($rootScope.boxleagueIdCache[id]) {
            success($rootScope.boxleagueIdCache[id]);
        } else {
            $http.get('/boxleague/' + id).then(function (response) {
                if (response && response.data) {
                    $rootScope.boxleagueIdCache[id] = response.data;
                    success($rootScope.boxleagueIdCache[id]);
                } else {
                    root.getError({data: "No boxleague for id " + id + " found"});
                }
            }, root.getError);
        }
    };

    root.getBoxleagueGames = function (id, success) {
        $rootScope.gamesCache = $rootScope.gamesCache || {};
        if ($rootScope.gamesCache[id]) {
            success($rootScope.gamesCache[id]);
        } else {
            $http.get('/games/boxleagueId/' + id).then(function (response) {
                if (response && response.data) {
                    $rootScope.gamesCache[id] = response.data;

                    success($rootScope.gamesCache[id]);
                } else {
                    root.getError({data: "No games for boxleague id " + id + " found"});
                }
            }, root.getError);
        }
    };

    root.getPlayerGames = function (id, success) {
        $rootScope.playerGamesCache = $rootScope.playerGamesCache || {};
        if ($rootScope.playerGamesCache[id]) {
            success($rootScope.playerGamesCache[id]);
        } else {
            $http.get('/games/homeId/' + id).then(function (response) {
                $rootScope.playerGamesCache[id] = response.data || [];

                $http.get('/games/awayId/' + id).then(function (response) {
                    $rootScope.playerGamesCache[id].concat(response.data || []);

                    success($rootScope.playerGamesCache[id]);
                }, root.getError);
            }, root.getError);
        }
    };

    root.resetCache = function () {
        delete $rootScope.playerGamesCache;
        delete $rootScope.gamesCache;
        delete $rootScope.boxleagueIdCache;
        delete $rootScope.boxleaguesCache;
        delete $rootScope.playersCache;
    };

    root.saveBoxleague = function (boxleague, games, players) {
        console.log("posting boxleague data ...");

        // keep a copy of the boxes, we will add these back later after the id is created
        var boxes = boxleague.boxes;
        // create a new copy of the boxleague with the known data
        boxleague = tennisService.createBoxleague("0", boxleague.name, boxleague.start, boxleague.end, []);
        // delete the id as this will be created by the database
        delete boxleague._id;

        // // clean data
        // var data = [];
        // $scope.newPlayers.forEach(function (player) {
        //     data.push({name: player.name, mobile: player.mobile, home: player.home, email: player.email});
        // });
        //
        // $http.post('/players', JSON.stringify(data)).then(function () {
        //     $rootScope.alerts.push({type: "success", msg: "Players saved"});
        //     $http.get('/players').then(function (response) {
        //         $scope.currentPlayers = response.data;
        //     }, function (response) {
        //         $scope.currentPlayers = [];
        //         $rootScope.alerts.push({
        //             type: "warning",
        //             msg: "Read failed with error '" + response.data
        //         });
        //     });
        // }, function (response) {
        //     $rootScope.alerts.push({
        //         type: "danger",
        //         msg: "Request failed with response '" + response.data + "' and status code: " + response.status
        //     });
        // });

        // var data = {database: 'boxleagues', doc: boxleague};
        // var promise = $http.post('submitDoc', JSON.stringify(data));

        var data = [];
        data.push(boxleague);
        var promise = $http.post('boxleagues', JSON.stringify(data));

        promise.success(function (response) {
            $rootScope.alerts.push({type: "success", msg: "#1 Saved initial boxleague"});

            // boxleague._id = response.id;
            // boxleague._rev = response.rev;

            boxleague._id = response[0]._id;
            boxleague._rev = response[0]._rev;

            // create a clean list of games
            games.forEach(function (game, index, array) {
                array[index] = tennisService.createGame("0", commonService.findById(players, game.homeId), commonService.findById(players, game.awayId), boxleague, game.box, game.schedule);
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
                        return commonService.findById(players, item);
                    });
                    var boxGames = commonService.findObjectsMatchingBox(games, box.name);
                    array[index] = tennisService.createBox(box.name, boxPlayers, boxGames);
                });

                // now save the boxleague for the second time with the boxes containing players and games
                boxleague.boxes = boxes;

                // var data = {database: 'boxleagues', doc: boxleague};
                // var promise = $http.post('submitDoc', JSON.stringify(data));

                var data = [];
                data.push(boxleague);
                var promise = $http.post('boxleagues', JSON.stringify(data));

                promise.success(function (response, status) {
                    $rootScope.alerts.push({type: "success", msg: "#3 Saved boxleague boxes"});

                    root.resetCache();
                    delete $rootScope.boxleague;
                    delete $rootScope.games;
                    delete $rootScope.players;
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

    return root;
});

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

// FILTERS
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
boxleagueApp.filter('toTitleCase', function () {
    return function (input) {
        if (typeof input === "string") {
            return input.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        } else {
            return input;
        }
    }
});
boxleagueApp.filter('leaderboardSort', function ($filter) {
    return function (input) {
        return $filter('orderBy')(input, ['-box', 'score', 'setsDiff', 'gamesDiff', 'name'], true);
    }
});
boxleagueApp.filter('boxesSort', function ($filter) {
    return function (input) {
        if (typeof input === "string") {
            return $filter('orderBy')(input.replace("Box ", ""));
        } else {
            return input;
        }
    }
});

//CONTROLLERS
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
boxleagueApp.controller('welcomeCtrl', ['$rootScope', '$log', function ($rootScope, $log) {
    $log.info("welcomeCtrl");

    $rootScope.alerts = [];
}]);
boxleagueApp.controller('tableCtrl', ['$scope', '$log', '$http', '$rootScope', '$routeParams', 'httpService', 'commonService', function ($scope, $log, $http, $rootScope, $routeParams, httpService, commonService) {
    $log.info("tableCtrl");

    var table = $routeParams.name;

    $scope.title = table;
    if (table.indexOf('s', table.length - 1)) {
        $scope.type = table.substring(0, table.length - 1);
    } else {
        $scope.type = table;
    }

    $http.get('/' + table).then(function (response) {
        $scope.rows = commonService.filterRows(response.data);
        var columns = commonService.getColumns($scope.rows);
        var filter = commonService.filterColumns(columns);

        // place schedule at the front if present
        if (filter.indexOf("name") !== -1) {
            filter = commonService.arraySplice(filter, "name");
            filter.unshift("name");
        }

        // place schedule at the front if present
        if (filter.indexOf("schedule") !== -1) {
            filter = commonService.arraySplice(filter, "schedule");
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

    $scope.sortColumn = function (column) {
        $scope.sortType = column;
        $scope.sortReverse = !$scope.sortReverse;
        return (column);
    }
}]);
boxleagueApp.controller('formCtrl', ['$scope', '$log', '$http', '$rootScope', '$routeParams', '$location', '$filter', 'httpService', 'commonService', function ($scope, $log, $http, $rootScope, $routeParams, $location, $filter, httpService, commonService) {
    $log.info("formCtrl");

    var table = $routeParams.name;
    var id = $routeParams.id;

    if (table === "boxleague" && !$rootScope.admin) {
        $location.url('/boxleague/' + id + '/boxes');
        return;
    }

    $scope.title = $filter('toTitleCase')(table);

    // find all available columns
    $http.get('/' + table + 's').then(function (response) {
        var data = response.data;
        var columns = commonService.getColumns(data);
        var filter = commonService.filterColumns(columns);

        // place schedule at the front if present
        if (filter.indexOf("name") !== -1) {
            filter = commonService.arraySplice(filter, "name");
            filter.unshift("name");
        }

        $scope.columns = filter;

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

        httpService.resetCache();

        // clean data before save
        var data = $scope.data;
        data = commonService.clone(data);
        delete data["$$hashKey"];
        if (data.available && data.available === "yes")
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
boxleagueApp.controller('settingsMainCtrl', ['$rootScope', '$log', '$location', 'httpService', 'commonService', function ($rootScope, $log, $location, httpService, commonService) {
    $log.info("settingsMainCtrl");

    httpService.getPlayers(function (players) {
        $location.url('/form/player/' + commonService.findByName(players, $rootScope.login)._id);
    })
}]);
boxleagueApp.controller('myBoxMainCtrl', ['$scope', '$rootScope', '$log', '$location', 'httpService', 'commonService', function ($scope, $rootScope, $log, $location, httpService, commonService) {
    $log.info("myBoxMainCtrl");

    $scope.loading = true;

    httpService.getActiveBoxleague(function (boxleague) {
        httpService.getPlayers(function (players) {

            var loginId = commonService.findByName(players, $rootScope.login)._id;
            var found = false;
            for (var i = 0; i < boxleague.boxes.length; i++) {
                var box = boxleague.boxes[i];
                if (box.playerIds.indexOf(loginId) !== -1) {
                    $location.url('/boxleague/' + boxleague._id + '/box/' + box.name);
                    found = true;
                    $scope.loading = false;

                    return;
                }
            }
            if(!found){
                $location.url('/welcome');
                $rootScope.myBox = false;
            }
            $scope.loading = false;
        });
    });
}]);
boxleagueApp.controller('scoreboardCtrl', function ($scope, $log, $uibModalInstance, tennisService, game) {
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
        if ($scope.dirty) {
            var score = tennisService.setsToScore(sets);
            $scope.valid = score === "" || (tennisService.isSetsSinglesScore(score, 3) && tennisService.isCompleteScore(score, 3));
            var points = tennisService.calculatePoints(score, 3);
            $scope.homePoints = points.home;
            $scope.awayPoints = points.away;
            $scope.dirty = false;
        }
        return $scope.valid;
    };

    // for + and - buttons
    $scope.decrement = function (score, index) {
        $scope.dirty = true;

        if (index === 0 && score === "C" || score === "W") {
            return 'W';
        }
        if (score === "0" || score === "C") {
            return 'C';
        }
        var num = parseInt(score);
        num = Math.max(0, num - 1);

        return num.toString();
    };
    $scope.increment = function (score, index) {
        $scope.dirty = true;

        if (index === 0 && score === "W") {
            return 'C';
        }
        if (score === "C") {
            return '0';
        }
        var num = parseInt(score);
        var max = index === 2 ? 99 : 7;
        num = Math.min(max, num + 1);

        return num.toString();
    };

    // main panel buttons
    $scope.ok = function () {
        game.score = tennisService.cleanScore(tennisService.setsToScore($scope.sets));
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
        $scope.sets = tennisService.scoreToSets($scope.score);
    };
    $scope.update = function () {
        $scope.score = tennisService.setsToScore($scope.sets);
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
    $scope.sets = tennisService.scoreToSets($scope.score);
});
boxleagueApp.controller('boxleagueCtrl', ['$log', '$location', 'httpService', function ($log, $location, httpService) {
    $log.info("boxleagueCtrl");

    httpService.getActiveBoxleague(function (boxleague) {
        $location.url('/boxleague/' + boxleague._id + '/boxes');
    });
}]);
boxleagueApp.controller('boxesCtrl', ['$scope', '$log', '$routeParams', 'httpService', 'commonService', function ($scope, $log, $routeParams, httpService, commonService) {
    $log.info("boxesCtrl");

    $scope.playerLookup = function (id) {
        return commonService.findById($scope.players, id).name;
    };

    httpService.getPlayers(function (players) {
        $scope.players = players;
    });

    httpService.getBoxleague($routeParams.id, function (boxleague) {
        $scope.boxleague = boxleague;
    });
}]);
boxleagueApp.controller('boxCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$q', '$uibModal', 'httpService', 'commonService', 'tennisService', function ($scope, $log, $resource, $routeParams, $rootScope, $http, $q, $uibModal, httpService, commonService, tennisService) {
    $log.info("boxCtrl");

    $scope.boxName = $routeParams.box;
    $scope.id = $routeParams.id;
    $scope.notAvailable = [];

    var setUpBox = function () {

        $scope.box = commonService.findByName($scope.boxleague.boxes, $scope.boxName);

        // update the box information for players
        $scope.box.players = [];
        $scope.box.playerIds.forEach(function (id) {
            $scope.box.players.push(commonService.findById($scope.players, id));
        });

        // update the box information for games
        $scope.box.games = [];
        $scope.box.gameIds.forEach(function (id) {
            $scope.box.games.push(commonService.findById($scope.games, id));
        });

        // update the player information for games
        $scope.box.games.forEach(function (game) {
            game.home = commonService.findById($scope.players, game.homeId).name;
            game.away = commonService.findById($scope.players, game.awayId).name;
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
        $scope.leaderboard = tennisService.calculateLeaderboard($scope.boxGames, $scope.players);
        var total = 0, played = 0;
        $scope.boxGames.forEach(function (game) {
            total++;
            if (tennisService.isCompleteScore(game.score, 3) && tennisService.isSetsSinglesScore(game.score, 3)) {
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
        var columns = commonService.getColumns($scope.boxGames);
        var filter = commonService.filterColumns(columns);
        filter = commonService.arraySplice(filter, "box");
        filter = commonService.arraySplice(filter, "schedule");
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
        columns = commonService.getColumns($scope.boxPlayers);
        filter = commonService.filterColumns(columns);

        // place schedule at the front if present
        if (filter.indexOf("name") !== -1) {
            filter = commonService.arraySplice(filter, "name");
            filter.unshift("name");
        }

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

    if ($rootScope.boxleague && $rootScope.games) {
        $scope.boxleague = $rootScope.boxleague;
        $scope.games = $rootScope.games;
        httpService.getPlayers(function (players) {
            $scope.players = players;

            setUpBox($scope.boxleague, $scope.players, $scope.games);
        })
    } else {
        httpService.getBoxleague($scope.id, function (boxleague) {
            $scope.boxleague = boxleague;
            httpService.getPlayers(function (players) {
                $scope.players = players;
                httpService.getBoxleagueGames($scope.id, function (games) {
                    $scope.games = games;

                    setUpBox($scope.boxleague, $scope.players, $scope.games);
                })
            });
        });
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
        console.log('Saving game ' + id);

        httpService.resetCache($rootScope);

        var game = commonService.findById($scope.games, id);
        // clean data before save
        game = commonService.clone(game);
        delete game["$$hashKey"];
        game.score = tennisService.cleanScore(game.score);

        var promise = $http.post('/game/' + game._id, JSON.stringify(game));

        promise.success(function (response) {
            game = commonService.findById($scope.games, id);
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
        if ($scope.boxleague.active === "no") {
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
boxleagueApp.controller('leaderboardMainCtrl', ['$scope', '$rootScope', '$log', '$location', '$http', 'httpService', function ($scope, $rootScope, $log, $location, $http, httpService) {
    $log.info("leaderboardMainCtrl");

    httpService.getActiveBoxleague(function (boxleague) {
        $location.url('/boxleague/' + boxleague._id + '/leaderboard');
    });
}]);
boxleagueApp.controller('leaderboardCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', 'httpService', 'tennisService', function ($scope, $log, $resource, $routeParams, $rootScope, httpService, tennisService) {
    $log.info("leaderboardCtrl");

    httpService.getBoxleague($routeParams.id, function (boxleague) {
        $scope.boxleague = boxleague;

        httpService.getPlayers(function (players) {
            $scope.players = players;

            httpService.getBoxleagueGames($routeParams.id, function (games) {
                $scope.games = games;

                $scope.leaderboard = tennisService.calculateLeaderboard($scope.games, $scope.players);

                var total = 0, played = 0;
                $scope.games.forEach(function (game) {
                    total++;
                    if (tennisService.isCompleteScore(game.score, 3) && tennisService.isSetsSinglesScore(game.score, 3)) {
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
            });
        });
    });
}]);
boxleagueApp.controller('nextBoxleagueCtrl', ['$scope', '$log', '$resource', '$routeParams', '$rootScope', '$http', '$filter', 'httpService', 'commonService', 'tennisService', function ($scope, $log, $resource, $routeParams, $rootScope, $http, $filter, httpService, commonService, tennisService) {
    $log.info("nextBoxleagueCtrl");

    httpService.getActiveBoxleague(function (boxleague) {
        $scope.boxleague = boxleague;

        httpService.getBoxleagueGames(boxleague._id, function (games) {
            $scope.games = games;

            httpService.getPlayers(function (players) {
                $scope.players = players;

                nextBoxleague($scope.boxleague, $scope.games, $scope.players)
            });
        });
    });

    var nextBoxleague = function (boxleague, games, players) {

        $scope.leaderboard = tennisService.calculateLeaderboard(games, players);

        $scope.leaderboard = $filter('leaderboardSort')($scope.leaderboard);

        // update the box information for players
        $scope.currentPlayers = [];
        boxleague.boxes.forEach(function (box) {
            box.playerIds.forEach(function (id) {
                $scope.currentPlayers.push(commonService.findById(players, id));
            });
        });
        $scope.currentPlayers.sort();

        $scope.nextBox = [];

        var boxNames = $scope.leaderboard.map(function (item) {
            return item.box
        });

        boxNames = boxNames.filter(commonService.unique);
        boxNames = boxNames.sort();
        $scope.boxNames = boxNames;

        for (var i = 0; i < boxNames.length; i++) {
            var current = boxNames[i];
            var above = boxNames[Math.max(0, i - 1)];
            var below = boxNames[Math.min(boxNames.length - 1, i + 1)];

            var box = commonService.findObjectsMatchingBox($scope.leaderboard, current);
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
        $scope.nextBox.splice(commonService.arrayObjectIndexOf($scope.nextBox, $scope.removeSelected.name, 'name'), 1);
        $scope.removed.push($scope.removeSelected);
    };

    $scope.added = [];
    $scope.add = function () {
        $scope.nextBox.push({name: $scope.playerSelected.name, newBox: $scope.boxSelected, change: 'added'});
        $scope.added.push($scope.playerSelected);

    };
}]);
boxleagueApp.controller('headToHeadMainCtrl', ['$rootScope', '$log', '$location', 'httpService', 'commonService', function ($rootScope, $log, $location, httpService, commonService) {
    $log.info("headToHeadMainCtrl");

    httpService.getPlayers(function (players) {
        var id = commonService.findByName(players, $rootScope.login)._id;
        $location.url('/headToHead/' + id);
    })
}]);
boxleagueApp.controller('headToHeadCtrl', ['$scope', '$log', '$rootScope', '$location', '$http', '$routeParams', 'httpService', 'commonService', 'tennisService', function ($scope, $log, $rootScope, $location, $http, $routeParams, httpService, commonService, tennisService) {
    $log.info("headToHeadCtrl");

    var setUp = function (id, boxleagues, players, games) {
        $scope.name = commonService.findById(players, id).name;
        $scope.players = players;

        var hasScore = [];
        var played = [];

        games.forEach(function (game) {
            var index = commonService.arrayObjectIndexOf(boxleagues, game.boxleagueId, "_id");
            game.boxleague = boxleagues[index].name;

            if (game.score && game.score.length) {
                hasScore.push(game);
                if (game.homeId !== id) {
                    played.push(commonService.findById(players, game.homeId));
                }
                if (game.awayId !== id) {
                    played.push(commonService.findById(players, game.awayId));
                }
            }
        });

        played = played.map(function (item) {
            return item._id
        });
        played = played.filter(commonService.unique);
        played = played.map(function (item) {
            return commonService.findById(players, item)
        });
        played = played.sort();

        $scope.games = hasScore;
        $scope.played = played;

        $scope.columns = ["date", "home", "away", "boxleague", "box", "score"];
        $scope.sortType = "date";
        $scope.sortReverse = false;
        $scope.searchName = "";
        $scope.sortBoxColumn = function (column) {
            $scope.sortType = column;
            $scope.sortReverse = !$scope.sortReverse;
            return (column);
        };
    };

    var id = $routeParams.id;

    // get all of the required data
    httpService.getBoxleagues(function (boxleagues) {
        httpService.getPlayers(function (players) {
            httpService.getPlayerGames(id, function (games) {
                setUp(id, boxleagues, players, games);
            });
        });
    });

    $scope.change = function (selected) {

        if (!selected) {
            $scope.searchName = '';
            delete $scope.leaderBoard;

            return;
        }

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
        $scope.leaderboard = tennisService.calculateLeaderboard(games, $scope.players);
    }
}]);

boxleagueApp.controller('importBoxleagueCtrl', ['$scope', '$log', '$http', '$rootScope', 'httpService', 'tennisService', 'commonService', function ($scope, $log, $http, $rootScope, httpService, tennisService, commonService) {
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
        var boxleague = tennisService.createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        httpService.saveBoxleague(boxleague, $rootScope.games, $rootScope.players);
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

                $rootScope.boxleague = tennisService.createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, []);
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

                        var game = tennisService.createGame(idCount.toString(),
                            commonService.findByName($rootScope.players, players[0]),
                            commonService.findByName($rootScope.players, players[1]),
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
                        ids.push(commonService.findByName($rootScope.players, player)._id);
                        players.push(commonService.findByName($rootScope.players, player));
                    });

                    var box = {
                        name: boxName,
                        games: games,
                        players: players,
                        playerIds: ids,
                        gameIds: commonService.findIdsMatchingName(games, boxName)
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
boxleagueApp.controller('importBoxleagueFileCtrl', ['$scope', '$log', '$http', '$rootScope', 'httpService', 'tennisService', 'commonService', function ($scope, $log, $http, $rootScope, httpService, tennisService, commonService) {
    $log.info("importBoxleagueFileCtrl");

    $scope.playerLookup = function (id) {
        return commonService.findById($scope.players, id).name;
    };

    var error = function (response) {
        $rootScope.alerts.push({
            type: "danger",
            msg: response.data
        });
    };

    httpService.getPlayers(function (players) {
        $scope.players = players;
        if (!$rootScope.boxleague) {
            $scope.boxleague = {};
            $scope.boxleague.name = "Import";
            $scope.boxleague.start = new Date;
            $scope.boxleague.end = new Date;
        } else {
            $scope.boxleague = $rootScope.boxleague;
        }
    });

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
        //var boxleague = tennisService.createBoxleague("0", $scope.boxleagueName, $scope.startDate, $scope.endDate, $rootScope.boxleague.boxes);
        httpService.saveBoxleague($rootScope.boxleague, $rootScope.games, $rootScope.players);
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

                $scope.boxleague = tennisService.createBoxleague("0", $scope.boxleague.name, $scope.boxleague.start, $scope.boxleague.end, []);

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
                            var game = tennisService.createGame(idCount.toString(),
                                commonService.findByName($scope.players, boxPlayers[i]),
                                commonService.findByName($scope.players, boxPlayers[j]),
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
                    var boxGames = commonService.findObjectsMatchingBox(games, boxName);

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
                        boxPlayers.push(commonService.findById($scope.players, id));
                    });

                    var box = tennisService.createBox(boxName, boxPlayers, boxGames);
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
boxleagueApp.controller('importPlayersCtrl', ['$scope', '$log', '$http', '$rootScope', 'httpService', 'commonService', function ($scope, $log, $http, $rootScope, httpService, commonService) {
    $log.info("importPlayersCtrl");

    $rootScope.alerts = [];

    $scope.currentPlayers = [];
    $scope.newPlayers = [];

    $http.get('/players').then(function (response) {
        $scope.currentPlayers = response.data;
        var filter = commonService.filterColumns(commonService.getColumns($scope.currentPlayers));
        // place schedule at the front if present
        if (filter.indexOf("name") !== -1) {
            filter = commonService.arraySplice(filter, "name");
            filter.unshift("name");
        }
        $scope.columns = filter;

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

