'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createRootSaga = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _reduxSaga = require('redux-saga');

var _check = require('./check');

var _check2 = _interopRequireDefault(_check);

var _functionArgNames = require('./functionArgNames');

var _functionArgNames2 = _interopRequireDefault(_functionArgNames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// --------------------------------------------------------------------  General helpers


var actionNum = 0;
var getActionType = function getActionType(prefix, actionName) {
    return (prefix != null ? prefix : "") + (actionName == null || actionName === "" ? "" + actionNum++ : actionName);
};

var makeActionCreator = function makeActionCreator(actionType) {
    var actionArgumentNames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var logBuilt = arguments[2];
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var action = { type: actionType };
        actionArgumentNames.forEach(function (key, idx) {
            action[key] = args[idx];
        });

        if (logBuilt) {
            console.log("New saga action:", action);
        }

        return action;
    };
};

var buildMaps = function buildMaps(prefix, actionAndSagaMap, defaultTakeEffect, checkAndWarn, logBuilt) {
    var actionCreatorMap = {};
    var sagaMap = {};
    var typeMap = {};
    var takeEffectMap = {};

    (0, _keys2.default)(actionAndSagaMap).forEach(function (actionName) {

        var actionType = getActionType(prefix, actionName);

        var _getSagaAndTakeEffect = getSagaAndTakeEffect(actionAndSagaMap, actionName, defaultTakeEffect),
            _getSagaAndTakeEffect2 = (0, _slicedToArray3.default)(_getSagaAndTakeEffect, 2),
            sagaGenerator = _getSagaAndTakeEffect2[0],
            takeEffect = _getSagaAndTakeEffect2[1];

        var actionArgumentNames = getSagaArgNames(sagaGenerator, actionType) || [];

        if (checkAndWarn) {
            (0, _check2.default)(actionType, actionArgumentNames, sagaGenerator);
        }

        actionCreatorMap[actionName] = makeActionCreator(actionType, actionArgumentNames, logBuilt);
        sagaMap[actionType] = sagaGenerator;
        takeEffectMap[actionType] = takeEffect;
        typeMap[actionName] = actionType;

        if (logBuilt) {
            console.log("\nActionCreator: " + actionName + "(" + actionArgumentNames.join(", ") + ")   --->   type: '" + actionType + "'");
        }
    });

    return [actionCreatorMap, sagaMap, typeMap, takeEffectMap];
};

// -------------------------------------------------------------  Saga-specific helpers

var getSagaAndTakeEffect = function getSagaAndTakeEffect(actionAndSagaMap, actionName, defaultTakeEffect) {
    var value = actionAndSagaMap[actionName];

    if (value == null) {
        return;
    }

    var sagaGenerator = void 0;
    var takeEffect = void 0;

    if (typeof value === 'function') {
        takeEffect = defaultTakeEffect;
        sagaGenerator = value;
    } else if (Array.isArray(value)) {
        takeEffect = value[0];
        sagaGenerator = value[1];
    } else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
        takeEffect = value["takeEffect"];
        sagaGenerator = value["saga"];
    }

    return [sagaGenerator, takeEffect];
};

var getSagaArgNames = function getSagaArgNames(sagaReducer, actionType) {
    if (sagaReducer != null) {
        var reducerArgs = _functionArgNames2.default.getArgs(sagaReducer);

        if (reducerArgs.length > 0) {
            var firstArg = reducerArgs[0];
            if (firstArg.substr(0, 4) === "_ref") {
                var refArgs = _functionArgNames2.default.getRefs(sagaReducer, firstArg);
                if (refArgs == null) {
                    console.warn("Possible flaw in goose action '" + actionType + "': the saga generator expects a deconstructed object ( e.g. {name1, name2, name3} ) as its " + "first argument, but this seems empty");
                }
                return refArgs || [];
            } else if (firstArg !== "action") {
                console.warn("Possible flaw in goose action '" + actionType + "': the saga generator expected 'action' as the name of its first argument");
                return [];
            }
        }
    }
};

//------------------------------------------------------------  Entry: class

/**
 *  Creates an action-actioncreator-rootsaga unified complex: a... goose, I guess.
 */

var GooseFactory = function () {
    function GooseFactory(actionTypePrefix, actionAndSagaMap) {
        var defaultTakeEffect = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _reduxSaga.takeEvery;
        var checkAndWarn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
        var logBuilt = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
        (0, _classCallCheck3.default)(this, GooseFactory);

        if (actionAndSagaMap == null || (typeof actionAndSagaMap === 'undefined' ? 'undefined' : (0, _typeof3.default)(actionAndSagaMap)) !== 'object') {
            throw Error("Can't create a goose without actionAndSagaMap: action creator name --> saga generator");
        }

        var _buildMaps = buildMaps(actionTypePrefix, actionAndSagaMap, defaultTakeEffect, checkAndWarn, logBuilt && window && window.console),
            _buildMaps2 = (0, _slicedToArray3.default)(_buildMaps, 4),
            actionCreatorMap = _buildMaps2[0],
            sagaMap = _buildMaps2[1],
            typeMap = _buildMaps2[2],
            takeEffectMap = _buildMaps2[3];

        this._actionCreatorMap = actionCreatorMap; // actionCreatorName    --> actionCreatorFunction
        this._sagaMap = sagaMap; // actionType           --> sagaGenerator
        this._typeMap = typeMap; // actionCreatorName    --> actionType
        this._takeEffectMap = takeEffectMap; // actionType           --> takeEffect

        this.getSagas = this.getSagas.bind(this);
        this.getActionCreators = this.getActionCreators.bind(this);
        this.getTypes = this.getTypes.bind(this);
        this.getTakeEffects = this.getTakeEffects.bind(this);
    }

    (0, _createClass3.default)(GooseFactory, [{
        key: 'getSagas',
        value: function getSagas() {
            return this._sagaMap;
        }
    }, {
        key: 'getActionCreators',
        value: function getActionCreators() {
            return this._actionCreatorMap;
        }
    }, {
        key: 'getTypes',
        value: function getTypes() {
            return this._typeMap;
        }
    }, {
        key: 'getTakeEffects',
        value: function getTakeEffects() {
            return this._takeEffectMap;
        }
    }]);
    return GooseFactory;
}();

exports.default = GooseFactory;
var createRootSaga = exports.createRootSaga = function createRootSaga(sagaMapArray, mergedTakeEffectMap) {
    var _marked = [rootSaga].map(_regenerator2.default.mark);

    var take = void 0;
    function rootSaga() {
        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, sagaTable, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, key;

        return _regenerator2.default.wrap(function rootSaga$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context.prev = 3;
                        _iterator = (0, _getIterator3.default)(sagaMapArray);

                    case 5:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                            _context.next = 37;
                            break;
                        }

                        sagaTable = _step.value;
                        _iteratorNormalCompletion2 = true;
                        _didIteratorError2 = false;
                        _iteratorError2 = undefined;
                        _context.prev = 10;
                        _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(sagaTable));

                    case 12:
                        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                            _context.next = 20;
                            break;
                        }

                        key = _step2.value;

                        take = mergedTakeEffectMap[key];
                        _context.next = 17;
                        return take(key, sagaTable[key]);

                    case 17:
                        _iteratorNormalCompletion2 = true;
                        _context.next = 12;
                        break;

                    case 20:
                        _context.next = 26;
                        break;

                    case 22:
                        _context.prev = 22;
                        _context.t0 = _context['catch'](10);
                        _didIteratorError2 = true;
                        _iteratorError2 = _context.t0;

                    case 26:
                        _context.prev = 26;
                        _context.prev = 27;

                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }

                    case 29:
                        _context.prev = 29;

                        if (!_didIteratorError2) {
                            _context.next = 32;
                            break;
                        }

                        throw _iteratorError2;

                    case 32:
                        return _context.finish(29);

                    case 33:
                        return _context.finish(26);

                    case 34:
                        _iteratorNormalCompletion = true;
                        _context.next = 5;
                        break;

                    case 37:
                        _context.next = 43;
                        break;

                    case 39:
                        _context.prev = 39;
                        _context.t1 = _context['catch'](3);
                        _didIteratorError = true;
                        _iteratorError = _context.t1;

                    case 43:
                        _context.prev = 43;
                        _context.prev = 44;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }

                    case 46:
                        _context.prev = 46;

                        if (!_didIteratorError) {
                            _context.next = 49;
                            break;
                        }

                        throw _iteratorError;

                    case 49:
                        return _context.finish(46);

                    case 50:
                        return _context.finish(43);

                    case 51:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _marked[0], this, [[3, 39, 43, 51], [10, 22, 26, 34], [27,, 29, 33], [44,, 46, 50]]);
    }
    return rootSaga;
};