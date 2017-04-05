"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var varNameRegex = "[a-zA-Z_$][0-9a-zA-Z_$]*";
var prePattern = new RegExp("function .*? ?\\(.*?\\)\\s*\\{\\s*", 'g');

/** Returns an array with the names of the direct names of a function (e.g. for the function a = (b, c) => {}
 *  getFunctionArgNames(a) will return ["b", "c"]).
 *
 *  Credit: https://davidwalsh.name/javascript-arguments
 */
var getFunctionArgNames = function getFunctionArgNames(funcStr) {
    var args = funcStr.match(/function.*?\(([^)]*)\)/)[1];
    return args.split(',').map(function (arg) {
        return arg.replace(/\/\*.*\*\//, '').trim();
    }).filter(function (arg) {
        return arg;
    });
};

/** Assumes the second argument of the function is an object, and parses the function body for fields used from it.
 * Returns an array of those fields, for use as action creator arguments.
 */
var getActionFields = function getActionFields(func) {
    var funcStr = func.toString();

    var funcArgNames = getFunctionArgNames(funcStr);
    if (funcArgNames && funcArgNames.length > 0) {
        var actionName = funcArgNames[0];

        // Isolates and removes the intro, expecting "function <name>(<variables>) { var" or returning null
        var chuckedIntro = funcStr.match(prePattern);
        if (chuckedIntro == null || chuckedIntro.length === 0) {
            return null;
        }
        var keptBody = funcStr.substr(chuckedIntro[0].length);

        // Keeps all instances of "X = <ref>.X", and makes and returns a list of all X'es.
        var pattern = new RegExp("\\b" + actionName + "\\." + varNameRegex, 'g');
        var matches = keptBody.match(pattern);
        return matches && matches.map(function (arg) {
            return arg.trim().split('.')[1];
        });

        // "[\\s\\(\\{\\+]" + // + "[\\s\\,\\;\\)\\}]?
    }

    return null;
};

exports.default = getActionFields;