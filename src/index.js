import { takeEvery } from 'redux-saga';
import check from './check';

import functionArgNames from './functionArgNames';


// --------------------------------------------------------------------  General helpers


let actionNum = 0;
const getActionType = (prefix, actionName) =>
(prefix != null ? prefix : "") +
((actionName == null || actionName === "") ?
    "" + (actionNum++) :
    actionName);


const makeActionCreator = (actionType, actionArgumentNames = []) => (...args) => {
    const action = {type: actionType};
    actionArgumentNames.forEach( (key, idx) => { action[key] = args[idx]; } );
    console.log("New reducer action:", action);
    return action;
};



const buildMaps = (prefix, actionAndReducerMap, checkAndWarn, logBuilt) => {
    const actionCreatorMap = {};
    const reducerMap = {};
    const typeMap = {};

    Object.keys(actionAndReducerMap).forEach( actionName => {

        const actionType = getActionType(prefix, actionName);
        let reducerFunction = actionAndReducerMap[actionName];
        const actionArgumentNames = getSagaArgNames(reducerFunction, actionType) || [];

        if (checkAndWarn) {
            check(actionType, actionArgumentNames, reducerFunction);
        }

        actionCreatorMap[actionName] = makeActionCreator(actionType, actionArgumentNames);
        reducerMap[actionType] = reducerFunction;
        typeMap[actionName] = actionType;

        if (logBuilt && window.console) {
            console.log("\nActionCreator: getActionCreators()." + actionName + "(" + actionArgumentNames.join(", ") + ")");
            console.log("\tType: getTypes()." + actionName + " = '" + actionType + "'");
        }
    });

    return [actionCreatorMap, reducerMap, typeMap];
};


// -------------------------------------------------------------  Saga-specific helpers

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
    constructor(actionAndSagaMaps, defaultSagaEffect = takeEvery, checkAndWarn = true, logBuilt = false) {


        /*


        constructor(actionTypePrefix, initialState, actionAndReducerMap, checkAndWarn = true) {
            if (actionAndReducerMap == null || (typeof actionAndReducerMap !== 'object')) {
                throw Error("Can't create a duck without actionAndReducerMap: action creator name --> reducer function");
            }
            if (!Array.isArray(actionAndSagaMapOrMaps)) {
                actionAndSagaMapOrMaps = [actionAndSagaMapOrMaps];
            }

            actionAndSagaMapOrMaps.forEach(actionAndSagaMap => {
                this._mutateActionAndSagaMap(actionAndSagaMap);
            });


            const [actionCreatorMap, sagaMap, typeMap] = buildMaps(
                actionTypePrefix, actionAndReducerMap, checkAndWarn, logBuilt);

            this._actionCreators = actionCreatorMap;
            this._rootSaga = makeReducer(sagaMap, initialState);
            this._types = typeMap;

            this.getRootSaga = this.getRootSaga.bind(this);
            this.getActionCreators = this.getActionCreators.bind(this);
            this.getTypes = this.getTypes.bind(this);
        }

        getRootSaga() { return this._rootSaga; }
        getActionCreators() { return this._actionCreators; }
        getTypes() { return this._types; }

        //*/



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

    getSagaTable() { return this._sagaTable; }
    getTakeEffectTable() { return this._takeEffectTable; }
}
GooseFactory.createRootSaga = (sagaTableArray, takeEffectTable) => {
    let take;
    function* rootSaga() {
        for (let sagaTable of sagaTableArray) {
            for (let key of Object.keys(sagaTable)) {
                take = takeEffectTable[key];
                yield take(key, sagaTable[key]);
            }
        }
    }
    return rootSaga;
};

export default GooseFactory;
