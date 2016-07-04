describe("Basic Test", function(){
   // Arrange
    var counter;

    beforeEach(function(){
        counter = 0;
    });

    it("increments value", function(){
        counter++;
        expect(counter).toEqual(1);
    });

    it("decrements value", function(){
        counter--;
        expect(counter).toEqual(-1);
    })
});

describe("Basic Welcome Controller Test", function(){
    // Arrange
    var mockScope = {};
    var mockLog;
    var controller;

    beforeEach(angular.mock.module("boxleagueApp"));

    beforeEach(angular.mock.inject(function($controller, $rootScope, $log){
        mockScope = $rootScope.$new();
        mockLog = $log;
        controller = $controller("welcomeCtrl", {
            $scope: mockScope,
            $log: mockLog
        })
    }));

    // Act and Access
    it("checks that the alert array is reset", function () {
        expect(mockScope.alerts).toBeDefined();
        expect(mockScope.alerts).toEqual([]);
    });

    it("writes a log message", function(){
        expect(mockLog.info.logs.length).toEqual(1);
    });
});

describe("Common Service Test", function(){
    // Arrange
    var mockScope = {};
    var factory;

    beforeEach(angular.mock.module("boxleagueApp"));

    beforeEach(angular.mock.inject(function(commonService, $rootScope){
        mockScope = $rootScope.$new();
        factory = commonService;
    }));

    // Act and Access
    it("checks clone", function () {
        // if cloned then objects are separate copies
        var rows1 = [{'one':true}, {'two': false}];

        var rows2 = factory.clone(rows1);
        expect(rows1).toEqual(rows2); // this is testing values
        rows2.one = false;
        expect(rows1).not.toEqual(rows2);

        // if equaled then not
        var rows3 = rows1;
        expect(rows1).toEqual(rows3);
        rows3.one = false;
        expect(rows1).toEqual(rows3);
    });
    it("checks getColumns", function () {
        var rows = [];
        expect(factory.getColumns(rows)).toEqual([]);

        rows = [{'one':true}, {'two': false}];
        expect(factory.getColumns(rows)).toEqual(['one', 'two']);

        rows = [{'one': true}, {'two': false}, {'two': true}];
        expect(factory.getColumns(rows)).toEqual(['one', 'two']);
    });
    it("checks arraySplice", function () {
        var rows = [];
        expect(factory.arraySplice(rows, 'one')).toEqual([]);

        rows = ['one', 'two', 'three'];
        expect(factory.arraySplice(rows, 'one')).toEqual(['two', 'three']);

        rows = ['one', 'two', 'three'];
        expect(factory.arraySplice(rows, 'four')).toEqual(rows);

        rows = ['one', 2, 'three'];
        expect(factory.arraySplice(rows, 2)).toEqual(['one', 'three']);
    });
    it("checks filterColumns", function () {
        var rows = [];
        expect(factory.filterColumns(rows)).toEqual([]);

        rows = ['Id', '_id', '_rev', '$$hashKey', 'boxes', "boxleague", "language", "views"];
        expect(factory.filterColumns(rows)).toEqual([]);

        rows.push('one');
        expect(factory.filterColumns(rows)).toEqual(['one']);
    });
    it("checks filterRows", function () {
        var rows = [];
        expect(factory.filterRows(rows)).toEqual([]);

        rows = [{'one':true}, {'two': false}];
        expect(factory.filterRows(rows)).toEqual(rows);

        // take a clone
        var before = JSON.parse(JSON.stringify(rows));
        rows.push({'language': true});
        expect(factory.filterRows(rows)).toEqual(before);
    });
    it("checks findObjectsMatchingBox", function () {
        var rows = [];
        expect(function(){ factory.findObjectsMatchingBox(rows, "one")}).toThrow("Could not find item with box: one");

        rows = [{box:'one'}, {box: 'two'}, {id: "1234"}];
        expect(factory.findObjectsMatchingBox(rows, "two")).toEqual([{box:'two'}]);

       rows = [{box:'three'}, {box: 'three'}, {id: "1234"}];
       expect(factory.findObjectsMatchingBox(rows, "three")).toEqual([{box:'three'}, {box:'three'}]);
    });
});