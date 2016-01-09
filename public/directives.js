// DIRECTIVES
boxleagueApp.directive("weatherReport", function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/weatherReport.html',
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

//boxleagueApp.directive("fileread", [function () {
//    return {
//        scope: {
//            opts: '='
//        },
//        link: function ($scope, $elm, $attrs) {
//            $elm.on('change', function (changeEvent) {
//                var reader = new FileReader();
//
//                reader.onload = function (evt) {
//                    $scope.$apply(function () {
//                        var data = evt.target.result;
//
//                        var workbook = XLSX.read(data, {type: 'binary'});
//
//                        var headerNames = XLSX.utils.sheet_to_json( workbook.Sheets[workbook.SheetNames[0]], { header: 1 })[0];
//
//                        var data = XLSX.utils.sheet_to_json( workbook.Sheets[workbook.SheetNames[0]]);
//
//                        $scope.opts.columnDefs = [];
//                        headerNames.forEach(function (h) {
//                            $scope.opts.columnDefs.push({ field: h });
//                        });
//
//                        $scope.opts.data = data;
//
//                        $elm.val(null);
//                    });
//                };
//
//                reader.readAsBinaryString(changeEvent.target.files[0]);
//            });
//        }
//    }
//}]);

boxleagueApp.directive("fileInput", [function ($parse) {
    return function( scope, elm, attrs ) {
    elm.bind('change', function( evt ) {
        scope.$apply(function() {
            scope[ attrs.name ] = evt.target.files[0].name;
        });
    });
  };
}]);