# Goosefactory
**Simple creation and use of 'geese' - a redux-saga analogy to redux ducks.**

## Background

[Redux](https://github.com/reactjs/redux) / [react redux](https://github.com/reactjs/react-redux) are pretty great, but as the code grows, things easily get cumbersome, complex and fragmented. [Redux ducks](https://github.com/erikras/ducks-modular-redux) is an interesting proposal for handling this: organizing the code in bundles of action creators, action types and reducers that belong together, in the very common cases where there's a one-to-one (-to-one) relationship between them.

I made a library for wrapping and simplifying this even more: [Duckfactory](https://github.com/espen42/duckfactory). It auto-generates action creators and action types and encapsulates them, only exposing them when needed for side purposes like unit testing. This way, you, the brilliant developer, can focus on what's going on in the reducers instead of on the boilerplate wiring everything together.

## What's a goose?

[redux-sagas](https://github.com/redux-saga/redux-saga) is a really handy library for handling asynchronous segments or just bundling chains of redux actions. I've used it for a while, but I have the same impression here as with general redux: most of the time actions, action creators, sagas and the take-effects that control them (takeEvery, takeLatest etc) belong together as a unit.

**A goose is that tuple: {action, action creator, saga, take-effect}.**

Goosefactory aims to make life as easy as possible when working with these units.

Why "goose'? Well, _ducks_ are named after the last syllable of _redux_. And while _goose_ isn't quite as similar to the last syllable in _sagas_, it is a bit similar to a duck.



## How does it work?
Short version: give it a prefix string to group the actions, an object with the names of action creators, and the sagas they trigger, where the argument names in the saga mirror the names of the fields in the action. In return, it will create an object that exposes ordinary redux action creators, saga generators and action types:

### Example

```javascript
import { put, call } from 'redux-sagas';
import GooseFactory from 'goosefactory';

// Let's assume we have some resources, for example:
import { searchNamesAPI, getUserAPI, getAdminAPI } from './myAPIs'; 
import { displayNames, setCurrentUser } from './someReduxActions';

// Defining two geese in one collection called 'users':
const userGeese = new GooseFactory("myapp/usergeese", {
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

```
Note the argument syntax in the saga generator: destructuring an action argument. It's also possible to just use a single `action` argument instead:
 
```javascript
	///...
	
	listUsers: function* (action) {
        const nameList = yield call(searchNamesAPI, action.nameSearchString);
        yield put(displayNames(nameList));
     },
        
    fetchUser: function* (action) {
        const api = action.isAdmin ? getAdminAPI : getUserAPI;
        const user = yield call(api, action.userId);
        yield put(setCurrentUser(user));
    }
    
    ///...
```

Both these syntaxes are fine (I prefer the first one). 

This constructs a goose bundle with the two sagas `listUsers` and `fetchUser`. You can now directly create regular redux actions like this:

```javascript

const actionCreators = userGeese.getActionCreators();

const action1 = actionCreators.listUsers("Arthur");
const action2 = actionCreators.fetchUser(42, true);

```

In this example, these two actions will look like this:

```javascript
console.log(action1);
//    {
//      type: "myapp/usergeese/listUsers",
//      nameSearchString: "Arthur"
//    }


console.log(action2);
//   {
//     type: "myapp/usergeese/fetchUser",
//     userId: 42,
//     isAdmin: true,
//  }
```

Note that the fields `nameSearchString`, `userId` and `isAdmin` are the names defined in the constructor above (derived from the destructured arguments, or in the 'action' syntax: derived from the way subfields of `action` are used in the generator). For this reason, it won't allow the sagas to have action arguments named `type`: that name's reserved for the action. 

These actions are ready to dispatch, and will trigger the sagas as in regular redux-sagas. 

 
### Hooking it up: creating a root saga
 
In order to use the actions like this, the sagas must be hooked up to the redux-sagas middleware in the ordinary way. To create a root saga for that, use the named export `createRootSaga`: it takes as argument an array of created goose collections and returns one rootSaga covering all of them.

```javascript
import { createRootSaga } from 'gooseFactory';

const rootSaga = createRootSaga([userGoose, anotherGoose]);
```
 

### Constructor:

```javascript
new GooseFactory(actionTypePrefix, actionAndSagaMap, defaultTakeEffect, checkAndWarn, logBuilt)
```

- `actionTypePrefix`: prefix string that is prepended before the action types. Must be globally unique, inside the same global namespace as all other goosefactories (and/or [duckfactories](https://github.com/espen42/duckfactory) if you use them together). This way, they can share a redux dispatcher. A slash is added at the end, in line with the redux-ducks suggestion.

- `actionAndSagaMap`: an object where the keys become the names of action creators, and the values are EITHER: 

	* anonymous generators that become the corresponding saga to the action creator, OR
	
   * an array where the first element is a redux-sagas takeEffect, specific for that saga, and the second element is the saga generator function as described above, OR
   
	* a JS object where the takeEffect and the saga are the values under those keys: `takeEffect` and `saga`.

- `defaultTakeEffect`: An optional takeEffect function that will replace the default redux-sagas takeEffect for the sagas in this particular goosefactory (the default is: `takeEvery`). Any saga-specific takeEffects in the previous argument will override this default (for that saga only, of course).

- `checkAndWarn`: An optional boolean (default: true) that sets whether to check the created goose for consistency: are the arguments correct? Does it produce actionTypes that are globally unique? Serious errors throw Errors, less serious ones only log a warning to the console.

- `logBuilt`: A last option boolean (default: false) set sets whether to log some details when an action creator is produced, and when it creates actions. Handy for development, no need for it in prod.


### After creation:

Although the goose encapsulates some moving parts such as action types, they are available as exported maps (regular JS objects):
- `.getActionCreators()`: actionCreator-name → actionCreator-function, as described above
- `.getSagas()`: actionType → saga-generator 
- `.getTypes()`: actionCreator name → actionType
- `.getTakeEffects()`: actionType → takeEffect


## Installation
```
npm install --save goosefactory
```
...or
```
yarn add goosefactory
```


**NOTE:** if your app uses minification/uglification, version 1.3.0 should be okay, but don't use the versions below. My own testing has been done with webpack 2 and yarn. If your mileage varies, please let me know.
 
## Contributions
Suggestions, improvements, corrections, bug notifications, etc... all is welcome on [github](https://github.com/espen42/goosefactory) or _espen42@gmail.com_. Special thanks to **NorwegianKiwi** for awesome help!