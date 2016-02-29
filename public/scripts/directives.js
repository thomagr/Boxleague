// DIRECTIVES
boxleagueApp.directive("dailyWeatherReport", function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/dailyWeatherReport.html',
        replace: true,
        scope: {
            weatherDay: "=",
            description: "=",
            convertToStandard: "&",
            convertToDate: "&",
            dateFormat: "@"
        }
    }
});

boxleagueApp.directive("hourlyWeatherReport", function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/hourlyWeatherReport.html',
        replace: true,
        scope: {
            weatherDay: "=",
            description: "=",
            convertToStandard: "&",
            convertToDate: "&",
            dateFormat: "@"
        }
    }
});

boxleagueApp.directive("playersTable", function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/playersTable.html',
        scope: {
            sortType: "=",
            sortReverse: "=",
            searchName: "=",
            players: "="
        }
    }
});

boxleagueApp.directive("fileInput", [function ($parse) {
    return function( scope, elm, attrs ) {
    elm.bind('change', function( evt ) {
        scope.$apply(function() {
            scope[ attrs.name ] = evt;
        });
    });
  };
}]);

boxleagueApp.directive("boxes", function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/boxPanel.html',
        scope: {
            box: "="
        }
    }
});