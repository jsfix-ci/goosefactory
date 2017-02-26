'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _reduxSaga = require('redux-saga');

var _check = require('./check');

var _check2 = _interopRequireDefault(_check);

var _functionArgNames = require('./functionArgNames');

var _functionArgNames2 = _interopRequireDefault(_functionArgNames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

/**
 *  Creates an action-actioncreator-rootsaga unified complex: a... goose, I guess.
 */

var GooseFactory = function () {
    function GooseFactory(actionTypePrefix, actionAndSagaMapOrMaps) {
        var _this = this;

        var checkAndWarn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        var defaultSagaEffect = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _reduxSaga.takeEvery;
        (0, _classCallCheck3.default)(this, GooseFactory);

        this._prefix = actionTypePrefix;
        this._sagaTable = {};
        this._takeEffectTable = {};
        this._actionNum = 0;
        this._checkAndWarn = checkAndWarn;
        this._defaultSagaEffect = defaultSagaEffect;

        this.createRootSaga = this.createRootSaga.bind(this);
        this.getSagas = this.getSagas.bind(this);
        this._makeActionCreator = this._makeActionCreator.bind(this);
        this._mutateActionAndSagaMap = this._mutateActionAndSagaMap.bind(this);

        if (actionAndSagaMapOrMaps != null && (typeof actionAndSagaMapOrMaps === 'undefined' ? 'undefined' : (0, _typeof3.default)(actionAndSagaMapOrMaps)) === 'object') {
            if (!Array.isArray(actionAndSagaMapOrMaps)) {
                actionAndSagaMapOrMaps = [actionAndSagaMapOrMaps];
            }
            actionAndSagaMapOrMaps.forEach(function (actionAndSagaMap) {
                _this._mutateActionAndSagaMap(actionAndSagaMap);
            });
        }
    }

    (0, _createClass3.default)(GooseFactory, [{
        key: '_mutateActionAndSagaMap',
        value: function _mutateActionAndSagaMap(actionAndSagaMap) {
            var _this2 = this;

            (0, _keys2.default)(actionAndSagaMap).forEach(function (actionName) {
                var value = actionAndSagaMap[actionName];

                if (value == null) {
                    return;
                }

                var sagaGenerator = void 0;
                var takeEffect = void 0;

                if (typeof value === 'function') {
                    takeEffect = _this2._defaultSagaEffect;
                    sagaGenerator = value;
                } else if (Array.isArray(value)) {
                    takeEffect = value[0];
                    sagaGenerator = value[1];
                } else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
                    takeEffect = value["takeEffect"];
                    sagaGenerator = value["saga"];
                }

                var actionArgumentNames = getSagaArgNames(sagaGenerator, actionName);

                actionAndSagaMap[actionName] = _this2._makeActionCreator(actionName, actionArgumentNames, takeEffect, sagaGenerator);
            });
        }
    }, {
        key: '_makeActionCreator',
        value: function _makeActionCreator(actionName) {
            var actionArgumentNames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
            var takeEffect = arguments[2];
            var sagaGenerator = arguments[3];

            var actionType = this._prefix + "_" + (actionName == null || actionName === "" ? "" + this._actionNum++ : actionName);

            if (this._checkAndWarn) {
                (0, _check2.default)(actionType, actionArgumentNames, sagaGenerator, false);
            }

            var actionCreator = function actionCreator() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var action = { type: actionType };

                actionArgumentNames.forEach(function (argName, i) {
                    action[argName] = args[i];
                });
                console.log("Created new saga action:", action);
                return action;
            };

            this._sagaTable[actionType] = sagaGenerator;
            this._takeEffectTable[actionType] = takeEffect;

            console.log("\nSaga actionCreator:", actionName + "(" + actionArgumentNames.join(", ") + ")");
            console.log("\t---> Action type: " + actionType);

            return actionCreator;
        }
    }, {
        key: 'getSagas',
        value: function getSagas() {
            return this._sagaTable;
        }
    }, {
        key: 'createRootSaga',
        value: function createRootSaga() {
            var _marked = [rootSaga].map(_regenerator2.default.mark);

            var self = this;
            function rootSaga() {
                var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, key;

                return _regenerator2.default.wrap(function rootSaga$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _iteratorNormalCompletion = true;
                                _didIteratorError = false;
                                _iteratorError = undefined;
                                _context.prev = 3;
                                _iterator = (0, _getIterator3.default)((0, _keys2.default)(self._sagaTable));

                            case 5:
                                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                    _context.next = 12;
                                    break;
                                }

                                key = _step.value;
                                _context.next = 9;
                                return self._takeEffectTable[key](key, self._sagaTable[key]);

                            case 9:
                                _iteratorNormalCompletion = true;
                                _context.next = 5;
                                break;

                            case 12:
                                _context.next = 18;
                                break;

                            case 14:
                                _context.prev = 14;
                                _context.t0 = _context['catch'](3);
                                _didIteratorError = true;
                                _iteratorError = _context.t0;

                            case 18:
                                _context.prev = 18;
                                _context.prev = 19;

                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }

                            case 21:
                                _context.prev = 21;

                                if (!_didIteratorError) {
                                    _context.next = 24;
                                    break;
                                }

                                throw _iteratorError;

                            case 24:
                                return _context.finish(21);

                            case 25:
                                return _context.finish(18);

                            case 26:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _marked[0], this, [[3, 14, 18, 26], [19,, 21, 25]]);
            }
            return rootSaga;
        }
    }]);
    return GooseFactory;
}();

exports.default = GooseFactory;