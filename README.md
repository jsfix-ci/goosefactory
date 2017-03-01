# Goosefactory
##### Simple creation and use of 'geese' - the redux-saga analogy to redux ducks.

### Why?
<a href="https://github.com/reactjs/redux">Redux</a> / <a href="https://github.com/reactjs/react-redux">react redux</a> are great, but it can produce a lot of boilerplate and fragmented code as a project grows, even for simple functionality. The concept of <a href="https://github.com/erikras/ducks-modular-redux">redux ducks</a> aims to simplify and structure this, in a great way in my humble opinion: bundle the reducers with the actions that they belong to (which in most cases are, or should be, a one-to-one relationship).

<a href="https://github.com/redux-saga/redux-saga">React-sagas</a> can be used pretty similarly in structure: action creators create actions, with action types, that trigger sagas. So far I haven't come across anything that helps to simplify this in the same way as ducks.

So here's taking a stab at it: the redux-sagas version of <a href="https://github.com/espen42/duckfactory">Duckfactory</a> (a sibling library made for bundling reducers instead of sagas).
 
### What? "Goose"?
Ducks are named after the last syllable of "redux". "Goose" seems like the obvious suggestion for the sagas parallel - it's a little bit similar to the last syllable in "sagas", and a little bit similar to a duck. Suggestions are welcome if you can think of a better name. 

Bet you can't, though.

### Where?

##### npm install goosefactory
...or
##### yarn add goosefactory


### How?
Give it a prefix string to group the actions, an object with the names of action creators and the sagas the actions should trigger, and it will create an object that exposes ordinary redux action creators, saga generators and action types:



#### Constructor arguments:
- _actionTypePrefix_: prefix string that is prepended before the action types. Must be globally unique, inside the same global namespace as all other goosefactories (AND duckfactories if you use them together). This way, they can share a redux dispatcher.

- _actionAndSagaMap_: an object where the keys become the names of action creators, and the values are EITHER: 
	* anonymous generators that become the corresponding saga to the action creator. The saga's arguments should be the same form as the second reducer argument in a duckfactory: either missing, or be a destructured object (for example: ({id, name, height}) ). If it is a destructured object, the content of that will become the arguments of the action creator (for example: (id, name, height) ), OR
   * an array where the first element is a redux-sagas takeEffect, specific for that saga, and the second element is the saga generator function as described above, OR
	* a JS object where the takeEffect and the saga are the values under those keys: 'takeEffect' and 'saga'.

- _defaultTakeEffect_: An optional takeEffect function that will replace the default redux-sagas takeEffect for the sagas in this particular goosefactory (the all-goosefactories default is: takeEvery). Any saga-specific takeEffects in the previous argument will override this default (for that saga only, of course).
- _checkAndWarn_: An optional boolean (default: true) that sets whether to check the created goose for consistency: are the arguments correct? Does it produce actionTypes that are globally unique? Serious errors throw Errors, less serious ones only log a warning to the console.
- _logBuilt_: A last option boolean (default: false) set sets whether to log some details when an action creator is produced, and when it creates actions. Handy for development, no need for it in prod.


#### Exposed after creation:

The resulting goose exports as js objects:
- _.getActionCreators()_: actionCreator-name → actionCreator-function
- _.getSagas()_: actionType → saga-generator
- _.getTypes()_: actionCreator name → actionType
- _.getTakeEffects()_: actionType → takeEffect

 
The actions and actionCreators are used the same way as in ordinary redux. Sagas in themselves can put ordinary redux-sagas effects.

#### Making a root saga:
The named export _createRootSaga_ takes as argument an array of created geese and returns one rootSaga covering all of them.

#### Examples
...coming soon. Until then, take a look at _src/goosefactory_spec.js_