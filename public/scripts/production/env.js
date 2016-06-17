// (function (window) {
//     window.__env = window.__env || {};
//     window.__env.production = true;
// }(this));

(function () {
    var __env = {};
    __env.production = true;

    // Register environment in AngularJS as constant
    boxleagueApp.constant('__env', __env);
}());