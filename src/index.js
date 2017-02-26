import { takeEvery } from 'redux-saga';
import check from './check';

import functionArgNames from './functionArgNames';

const getSagaArgNames = (sagaReducer, actionType) => {
    if (sagaReducer != null) {
        const reducerArgs = functionArgNames.getArgs(sagaReducer);

        if (reducerArgs.length > 0) {
            const firstArg = reducerArgs[0];
            if (firstArg.substr(0, 4) === "_ref") {
                const refArgs = functionArgNames.getRefs(sagaReducer, firstArg);
                if (refArgs == null) {
                    console.warn("Possible flaw in goose action '" + actionType +
                        "': the saga generator expects a deconstructed object ( e.g. {name1, name2, name3} ) as its " +
                        "first argument, but this seems empty");

                }
                return refArgs || [];

            } else if (firstArg !== "action") {
                console.warn("Possible flaw in goose action '" + actionType +
                    "': the saga generator expected 'action' as the name of its first argument");
                return [];
            }
        }
    }
};

/**
 *  Creates an action-actioncreator-rootsaga unified complex: a... goose, I guess.
 */
class GooseFactory {
    constructor(actionTypePrefix, actionAndSagaMapOrMaps, checkAndWarn = true, defaultSagaEffect = takeEvery) {
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

        if (actionAndSagaMapOrMaps != null && (typeof actionAndSagaMapOrMaps === 'object')) {
            if (!Array.isArray(actionAndSagaMapOrMaps)) {
                actionAndSagaMapOrMaps = [actionAndSagaMapOrMaps];
            }
            actionAndSagaMapOrMaps.forEach(actionAndSagaMap => {
                this._mutateActionAndSagaMap(actionAndSagaMap);
            });
        }
    }

    _mutateActionAndSagaMap(actionAndSagaMap) {
        Object.keys(actionAndSagaMap).forEach( actionName => {
            let value = actionAndSagaMap[actionName];

            if (value == null) {
                return;
            }

            let sagaGenerator;
            let takeEffect;

            if ((typeof value) === 'function') {
                takeEffect = this._defaultSagaEffect;
                sagaGenerator = value;

            } else if (Array.isArray(value)) {
                takeEffect = value[0];
                sagaGenerator = value[1];

            } else if ((typeof value) === 'object') {
                takeEffect = value["takeEffect"];
                sagaGenerator = value["saga"];
            }

            const actionArgumentNames = getSagaArgNames(sagaGenerator, actionName);

            actionAndSagaMap[actionName] = this._makeActionCreator(
                actionName, actionArgumentNames, takeEffect, sagaGenerator);
        });
    }

    _makeActionCreator(actionName, actionArgumentNames = [], takeEffect, sagaGenerator) {
        const actionType = this._prefix + "_" + ((actionName == null || actionName === "") ?
                "" + (this._actionNum++) :
                actionName);

        if (this._checkAndWarn) {
            check(actionType, actionArgumentNames, sagaGenerator, false);
        }


        const actionCreator = (...args) => {
            const action = {type: actionType};

            actionArgumentNames.forEach( (argName, i) => { action[argName] = args[i]; } );
            console.log("Created new saga action:", action);
            return action;
        };


        this._sagaTable[actionType] = sagaGenerator;
        this._takeEffectTable[actionType] = takeEffect;

        console.log("\nSaga actionCreator:", actionName + "(" + actionArgumentNames.join(", ") + ")");
        console.log("\t---> Action type: " + actionType);

        return actionCreator;
    }

    getSagas() {
        return this._sagaTable;
    }

    createRootSaga() {
        const self = this;
        function* rootSaga() {
            for (let key of Object.keys(self._sagaTable)) {
                yield self._takeEffectTable[key]( key, self._sagaTable[key]);
            }
        }
        return rootSaga;
    }


}
export default GooseFactory;
