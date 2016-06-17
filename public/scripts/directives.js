boxleagueApp.directive("dailyWeatherReport", function () {
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

boxleagueApp.directive("hourlyWeatherReport", function () {
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

boxleagueApp.directive("genericTable", function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/table.html',
        scope: {
            sortType: "=",
            sortReverse: "=",
            searchName: "=",
            toTitleCase: "=",
            sortColumn: "=",
            rows: "=",
            columns: "=",
            type: "="
        }
    }
});

boxleagueApp.directive("fileInput", [function ($parse) {
    return function (scope, elm, attrs) {
        elm.bind('change', function (evt) {
            scope.$apply(function () {
                scope[attrs.name] = evt;
            });
        });
    };
}]);

boxleagueApp.directive("boxes", function () {
    return {
        restrict: 'E',
        templateUrl: 'directives/boxPanel.html',
        scope: {
            box: "=",
            boxleagueId: "=",
            playerLookup: "&"
        }
    }
});
