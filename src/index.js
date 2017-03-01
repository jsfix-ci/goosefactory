import { takeEvery } from 'redux-saga';
import check from './check';

import functionArgNames from './functionArgNames';

const canLog = window && window.console;

// --------------------------------------------------------------------  General helpers


let actionNum = 0;
const getActionType = (prefix, actionName) =>
(prefix != null ? prefix : "") +
((actionName == null || actionName === "") ?
    "" + (actionNum++) :
    actionName);


const makeActionCreator = (actionType, actionArgumentNames = [], logBuilt) => (...args) => {
    const action = {type: actionType};
    actionArgumentNames.forEach( (key, idx) => { action[key] = args[idx]; } );

    if (logBuilt) {
        console.log("New saga action:", action);
    }

    return action;
};

const buildMaps = (prefix, actionAndSagaMap, defaultTakeEffect, checkAndWarn, logBuilt) => {
    const actionCreatorMap = {};
    const sagaMap = {};
    const typeMap = {};
    const takeEffectMap = {};

    Object.keys(actionAndSagaMap).forEach( actionName => {

        const actionType = getActionType(prefix, actionName);

        const [saga, takeEffect] = getSagaAndTakeEffect(actionAndSagaMap, actionName, defaultTakeEffect);

        const actionArgumentNames = getSagaArgNames(saga, actionType) || [];

        if (checkAndWarn) {
            check(actionType, actionArgumentNames, saga);
        }

        actionCreatorMap[actionName] = makeActionCreator(actionType, actionArgumentNames, logBuilt);
        sagaMap[actionType] = saga;
        takeEffectMap[actionType] = takeEffect;
        typeMap[actionName] = actionType;

        if (logBuilt) {
            console.log("\nActionCreator: " + actionName + "(" + actionArgumentNames.join(", ") + ")   --->   type: '" + actionType + "'");
        }
    });

    return [actionCreatorMap, sagaMap, typeMap, takeEffectMap];
};


// -------------------------------------------------------------  Saga-specific helpers

const getSagaAndTakeEffect = (actionAndSagaMap, actionName, defaultTakeEffect) => {
    let value = actionAndSagaMap[actionName];

    if (value == null) {
        return;
    }

    let saga;
    let takeEffect;

    if ((typeof value) === 'function') {
        takeEffect = defaultTakeEffect;
        saga = value;

    } else if (Array.isArray(value)) {
        takeEffect = value[0];
        saga = value[1];

    } else if ((typeof value) === 'object') {
        takeEffect = value["takeEffect"];
        saga = value["saga"];
    }

    return [saga, takeEffect];
};

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



//------------------------------------------------------------  Entry: class

/**
 *  Creates an action-actioncreator-rootsaga unified complex: a... goose, I guess.
 */
class GooseFactory {
    constructor(actionTypePrefix, actionAndSagaMap, defaultTakeEffect = takeEvery, checkAndWarn = true, logBuilt = false) {
        if (actionAndSagaMap == null || (typeof actionAndSagaMap !== 'object')) {
            throw Error("Can't create a goose without actionAndSagaMap: action creator name --> saga generator");
        }

        const [actionCreatorMap, sagaMap, typeMap, takeEffectMap] = buildMaps(
            actionTypePrefix, actionAndSagaMap, defaultTakeEffect, checkAndWarn, logBuilt && canLog);

        this._actionCreatorMap = actionCreatorMap;      // actionCreatorName    --> actionCreatorFunction
        this._sagaMap = sagaMap;                        // actionType           --> sagaGenerator
        this._typeMap = typeMap;                        // actionCreatorName    --> actionType
        this._takeEffectMap = takeEffectMap;            // actionType           --> takeEffect

        this.getSagas = this.getSagas.bind(this);
        this.getActionCreators = this.getActionCreators.bind(this);
        this.getTypes = this.getTypes.bind(this);
        this.getTakeEffects = this.getTakeEffects.bind(this);
    }

    getSagas() { return this._sagaMap; }
    getActionCreators() { return this._actionCreatorMap; }
    getTypes() { return this._typeMap; }
    getTakeEffects() { return this._takeEffectMap; }

}

export default GooseFactory;

export const createRootSaga = (gooseArray) => {
    let takeEffect, sagaMap, takeEffectMap;
    function* rootSaga() {
        for (let goose of gooseArray) {
            sagaMap = goose.getSagas();
            takeEffectMap = goose.getTakeEffects();
            for (let actionType of Object.keys(sagaMap)) {
                takeEffect = takeEffectMap[actionType];
                yield takeEffect(actionType, sagaMap[actionType]);
            }
        }
    }
    return rootSaga;
};
