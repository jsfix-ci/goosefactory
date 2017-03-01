import functionArgNames from './functionArgNames';

if (window) {
    if (!window.__takenActionNames__) {
        window.__takenActionNames__ = new Set();
    }
}
const takenActionNames = (window) ? window.__takenActionNames__ : new Set();

const checkActionName = actionName => {
    if ((typeof actionName) !== 'string' && (typeof actionName) !== 'number') {
        throw Error("Action name can't be " + JSON.stringify(actionName) + " (" + typeof actionName + "). " +
            "Only strings or numbers are allowed.");
    }
    if (takenActionNames.has(actionName)) {
        throw Error("Action name " + JSON.stringify(actionName) + " is already taken. Action types " +
            "(prefix + action name) must be unique. Existing names are: " + JSON.stringify(takenActionNames));
    }
    takenActionNames.add(actionName);
};

const checkActionArgumentNames = (actionArgumentNames, actionType) => {
    actionArgumentNames.forEach( name => {
        if (name === "type") {
            throw Error("Illegal action argument name for action '" + actionType + "' - an argument can't be called " +
                "'type', since that's internally reserved.");
        }
    });
};


export default (actionType, actionArgumentNames = [], func) => {
    let healthy = true;

    checkActionName(actionType);

    if (func != null) {
        const reducerArgs = functionArgNames.getArgs(func);

        checkActionArgumentNames(actionArgumentNames, actionType);

        if (reducerArgs.length > 0) {
            if (reducerArgs[0].substr(0,4) === "_ref") {
                const refArgs = functionArgNames.getRefs(func, reducerArgs[0]);
                if (refArgs == null) {
                    console.warn("Possibly flawed action '" + actionType +
                        "': the saga generator seems to expect a deconstructed object ( {name1, name2, name3} etc) " +
                        "as its first  argument, but this seems empty");
                    healthy = false;

                }
            }
        }
    }

    return healthy;
};

