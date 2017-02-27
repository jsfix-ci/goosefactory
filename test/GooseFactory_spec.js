import { expect } from 'chai';
//import { takeLatest } from 'redux-saga';

import GooseFactory from '../src/';


const GOOSE_ACTIONS = {
    woopOnce: function* ({woop}) { yield woop; },
    awrightTwice: function* () { yield "Awright then"; yield "Awright now"; },
    twoThreeOneAwright: function* ({one, two, three}) {
        yield two;
        yield three;
        yield one;
        yield "Awright";
    },
};

describe("GooseFactory", ()=> {
    describe(".getActionCreators", ()=> {
        it("exposes an object with actions creators, corresponding to the keys in the object sent to the creator, " +
            "where the actioncreator's arguments are the saga generator's deconstructed action arguments", () => {
            const gooseFactory = new GooseFactory("goose/test1/", GOOSE_ACTIONS, undefined, true, true);
            const actions = gooseFactory.getActionCreators();

            const action1 = actions.woopOnce(2, 42, 777);
            expect(action1).to.deep.equal({
                type: "goose/test1/woopOnce",
                woop: 2,
            });

            const action2 = actions.awrightTwice(2, 42, 777);
            expect(action2).to.deep.equal({
                type: "goose/test1/awrightTwice",
            });

            const action3 = actions.twoThreeOneAwright(2, 42, 777);
            expect(action3).to.deep.equal({
                type: "goose/test1/twoThreeOneAwright",
                one: 2,
                two: 42,
                three: 777,
            });
        });
    });


    describe(".getTypes", ()=> {
        it("exposes the action type associated with each of the goose's action creator names", ()=>{
            const gooseFactory = new GooseFactory("goose/test2/", GOOSE_ACTIONS, undefined, true, true);

            const types = gooseFactory.getTypes();

            expect(types.woopOnce = 'goose/test2/woopOnce');
            expect(types.awrightTwice = 'goose/test2/awrightTwice');
            expect(types.twoThreeOneAwright = 'goose/test2/twoThreeOneAwright');
        });
    });

    /*describe(".getTakeEffects", ()=>{
        it("exposes the redux-saga effect (or other take-actiontype-and-yield-generator-able function)" +
           "associated with each of the goose's action types", ()=>{

            // undefined means use takeEvery as takeEffect
            const gooseFactory1 = new GooseFactory("goose/takeEvery/", GOOSE_ACTIONS, undefined, true, true);

            const takeEffects1 = gooseFactory1.getTakeEffects();
            Object.keys(takeEffects1).forEach( key => {
                console.log("type:", key, "--- effect:", takeEffects1[key]);
            });


            // Checks a replaced default effect
            const gooseFactory2 = new GooseFactory("goose/takeLatest/", GOOSE_ACTIONS, takeLatest, true, true);

            const takeEffects2 = gooseFactory2.getTakeEffects();
            Object.keys(takeEffects2).forEach( key => {
                console.log("type:", key, "--- effect:", takeEffects2[key]);
            });

            // TODO: Can takeEvery and takeLatest be separated? Or used like this at all?
        });
    });*/


    // .
    describe(".getSagas", ()=>{
        it("exposes a map from each actionType to the saga it will trigger", ()=>{
            const gooseFactory = new GooseFactory("goose/test3/", GOOSE_ACTIONS, undefined, true, true);

            const sagas = gooseFactory.getSagas();
            const actions = gooseFactory.getActionCreators();

            const woopOnceSaga = sagas["goose/test3/woopOnce"];
            const woopOnceGen = woopOnceSaga(actions.woopOnce("yes!"));
            expect(woopOnceGen.next().value).to.equal("yes!");
            const dn = woopOnceGen.next();
            expect(dn.value).to.equal(undefined);
            expect(dn.done).to.equal(true);



            const awrightTwiceSaga = sagas["goose/test3/awrightTwice"];
            const awrightTwiceGen = awrightTwiceSaga(actions.awrightTwice());
            expect(awrightTwiceGen.next().value).to.equal("Awright then");
            expect(awrightTwiceGen.next().value).to.equal("Awright now");
            const dn2 = awrightTwiceGen.next();
            expect(dn2.value).to.equal(undefined);
            expect(dn2.done).to.equal(true);




            const twoThreeOneAwrightSaga = sagas["goose/test3/twoThreeOneAwright"];
            const twoThreeOneAwrightGen = twoThreeOneAwrightSaga(actions.twoThreeOneAwright(2, "Hei", null));
            expect(twoThreeOneAwrightGen.next().value).to.equal("Hei");
            expect(twoThreeOneAwrightGen.next().value).to.equal(null);
            expect(twoThreeOneAwrightGen.next().value).to.equal(2);
            expect(twoThreeOneAwrightGen.next().value).to.equal("Awright");
            const dn3 = twoThreeOneAwrightGen.next();
            expect(dn3.value).to.equal(undefined);
            expect(dn3.done).to.equal(true);
        });
    });
});
