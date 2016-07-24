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
//
// boxleagueApp.directive("fileSelect", [function ($parse) {
//     return function (scope, elm, attrs) {
//         elm.html('<input type="file" name="files"/>');
//         elm.bind('change', function (evt) {
//             scope.$apply(function () {
//                 scope[attrs.name] = evt;
//             });
//         });
//     };
// }]);

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

// boxleagueApp.directive('fileSelect', function() {
//     var template = '<input type="file" name="files"/>';
//     return function( scope, elem, attrs ) {
//         var selector = $( template );
//         elem.append(selector);
//         selector.bind('change', function( event ) {
//             scope.$apply(function() {
//                 scope[ attrs.fileSelect ] = event.originalEvent.target.files;
//             });
//         });
//         scope.$watch(attrs.fileSelect, function(file) {
//             selector.val(file);
//         });
//     };
// });
