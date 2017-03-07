# Goosefactory
**Simple creation and use of 'geese' - a redux-saga analogy to redux ducks.**

[Redux](https://github.com/reactjs/redux) / [react redux](https://github.com/reactjs/react-redux) are pretty great.

But suddenly: boilerplate and messiness. Things can get more cumbersome and complex and fragmented than what seems justifiable, even though there tends to be a one-to-one (-to-one) relationship between action creators, action types and reducers in the majority of cases. [Redux ducks](https://github.com/erikras/ducks-modular-redux) is an interesting proposal for making the code easier to organize and handle in those cases. 

I currently enjoy getting into combining redux with [react-sagas](https://github.com/redux-saga/redux-saga). I have the same impression here: it seems the most tidy way to do it is to make sure one action creator creates actions of one type, which triggers one single saga.
 


 
## Therefore: goose
Ducks are named after the last syllable of _redux_. "Goose" is isn't quite as similar to the last syllable in _sagas_, but it IS a little bit similar to a duck:

A tuple of { action-creator, action-type, saga-generator, take-effect }.

## A wrapper to easily define and use them 

A sibling library, [Duckfactory](https://github.com/espen42/duckfactory), was made for bundling actioncreators and -types with reducers, and handling the mess internally and conveniently - while also exposing them for unit testing etc.

Goosefactory does the same thing with sagas instead (and optionally, take-effects like `takeEvery` or `takeLatest`). 



## Installation
```
npm install --save goosefactory
```
...or
```
yarn add goosefactory
```

**Also note!** Although it's not an explicit npm dependency, goosefactory uses [ES6 object destructuring](https://hacks.mozilla.org/2015/05/es6-in-depth-destructuring/) in the saga generator parameters. 

## How does it work?
Short version: give it a prefix string to group the actions, an object with the names of action creators and the sagas the actions should trigger, and it will create an object that exposes ordinary redux action creators, saga generators and action types:

#### Defining a goose

```
import { put, call } from 'redux-sagas';
import GooseFactory from 'duckfactory';

// Let's also assume we have some other resources, for example:
import { searchNamesAPI, getUserAPI, getAdminAPI } from './myAPIs'; 
import { displayNames, setCurrentUser } from './someReduxActions';

// Constructing the wrapper:
const userGoose = new GooseFactory("users", {
    listUsers: function* ({nameSearchString}) {
        const nameList = yield call(searchNamesAPI, nameSearchString);
        yield put(displayNames(nameList));
    },
    
    fetchUser: function* ({userId, isAdmin}) {
        const api = isAdmin ? getAdminAPI : getUserAPI;
        const user = yield call(api, userId);
        yield put(setCurrentUser(user));
    }
});

const actionCreators = userGoose.getActionCreators();

```

This will construct a goose bundle with the two sagas `listUsers` and `fetchUser`. Also, `actionCreators` now exposes two action creators that triggers one saga each. These manually written action creators _would be_ identical:

```
const listUsers = (nameSearchString) => ({
   type: "users/listUsers",
   nameSearchString: nameSearchString
});

const fetchUser = (userId, isAdmin) => ({
   type: "users/fetchUser",
   userId: userId,
   isAdmin: isAdmin,
});
```

Instead, just use the generated action creators directly:

```
dispatch(actionCreators.listUsers("arthur"));
dispatch(actionCreators.fetchUser(183482374, false));
```

 
 
#### Creating a root saga
 
In order to use the actions like this, the sagas must be hooked up to the redux-sagas middleware in the ordinary way. To create a root saga for that, use the named export `createRootSaga`, it takes as argument an array of created geese and returns one rootSaga covering all of them.
```
import { createRootSaga } from 'gooseFactory';

const rootSaga = createRootSaga([userGoose, anotherGoose]);
```
 

#### More about the constructor:
- `actionTypePrefix`: prefix string that is prepended before the action types. Must be globally unique, inside the same global namespace as all other goosefactories (AND duckfactories if you use them together). This way, they can share a redux dispatcher.

- `actionAndSagaMap`: an object where the keys become the names of action creators, and the values are EITHER: 
	* anonymous generators that become the corresponding saga to the action creator. The saga's arguments should be the same form as the second reducer argument in a duckfactory: either missing, or be a destructured object (for example: ({id, name, height}) ). If it is a destructured object, the content of that will become the arguments of the action creator (for example: (id, name, height) ), OR
   * an array where the first element is a redux-sagas takeEffect, specific for that saga, and the second element is the saga generator function as described above, OR
	* a JS object where the takeEffect and the saga are the values under those keys: 'takeEffect' and 'saga'.

- `defaultTakeEffect`: An optional takeEffect function that will replace the default redux-sagas takeEffect for the sagas in this particular goosefactory (the all-goosefactories default is: takeEvery). Any saga-specific takeEffects in the previous argument will override this default (for that saga only, of course).
- `checkAndWarn`: An optional boolean (default: true) that sets whether to check the created goose for consistency: are the arguments correct? Does it produce actionTypes that are globally unique? Serious errors throw Errors, less serious ones only log a warning to the console.
- `logBuilt`: A last option boolean (default: false) set sets whether to log some details when an action creator is produced, and when it creates actions. Handy for development, no need for it in prod.


#### More about what it exposes after creation:

The resulting goose exports as maps (regular JS objects):
- `.getActionCreators()`: actionCreator-name → actionCreator-function
- `.getSagas()`: actionType → saga-generator
- `.getTypes()`: actionCreator name → actionType
- `.getTakeEffects()`: actionType → takeEffect

 
 
## Contributions
Suggestions for all kinds of stuff are welcome. For example, for a better name than "goose" if you can think of one. 

Bet you can't, though.