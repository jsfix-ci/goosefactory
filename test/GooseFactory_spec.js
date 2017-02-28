import { expect } from 'chai';
import { takeLatest } from 'redux-saga';

import GooseFactory, { createRootSaga } from '../lib/';


const GOOSE_ACTIONS = {
    woopOnce: function* ({woop}) { console.log("woopOnce"); yield woop; },
    awrightTwice: function* () { console.log("awrightTwice"); yield "Awright then"; yield "Awright now"; },
    twoThreeOneAwright: function* ({one, two, three}) {
        console.log("twoThreeOneAwright");
        yield two;
        yield three;
        yield one;
        yield "Awright";
    },
};
const MORE_ACTIONS = {
    stuff: function* ({stuffed}) { console.log("stuff"); yield "Something :" + stuffed; },
    more: function* ({even, more}) { console.log("more"); yield more; yield even; yield "Okay, I'm done.";},
};

/* Demonstrates two optional ways to individually override the default rootSaga takeEffect. Note the named functions. */
const REPLACED_TAKEEFFECTS = {
    dvno: [takeLatest, function* dvno() { console.log("DVNO"); yield "DVNO"; }],
    fourCap: {
        takeEffect: takeLatest,
        saga: function* fourCap() {
            console.log("FourCapitalLetters"); yield "FourCapitalLetters";
        },
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


    describe("createRootSaga", ()=>{
        it("takes an array of gooseFactories and creates one rootSaga, with overrideable rootSaga takeEffects", ()=>{
            const gooseFactory = new GooseFactory(
                "goose/test4/",
                GOOSE_ACTIONS,
                undefined, // Default takeEffect: takeEvery
                true, true);
            const moreFactory = new GooseFactory(
                "goose/test5/",
                MORE_ACTIONS,
                takeLatest, // Overrides default takeEffect for this whole gooseFactory: takeLatest
                true, true);
            const replacedTakeEffects = new GooseFactory(
                "goose/test6/",
                REPLACED_TAKEEFFECTS,
                undefined, // No new default here, but has takeEffect overrides for each action in REPLACED_TAKEEFFECTS
                true, true);

            const rootSaga = createRootSaga([gooseFactory, moreFactory, replacedTakeEffects]);
            const rootGen = rootSaga();

            expect(rootGen.next().value.name).to.equal('takeEvery(goose/test4/woopOnce, woopOnce)');
            expect(rootGen.next().value.name).to.equal('takeEvery(goose/test4/awrightTwice, awrightTwice)');
            expect(rootGen.next().value.name).to.equal('takeEvery(goose/test4/twoThreeOneAwright, twoThreeOneAwright)');
            expect(rootGen.next().value.name).to.equal('takeLatest(goose/test5/stuff, stuff)');
            expect(rootGen.next().value.name).to.equal('takeLatest(goose/test5/more, more)');
            expect(rootGen.next().value.name).to.equal('takeLatest(goose/test6/dvno, dvno)');
            expect(rootGen.next().value.name).to.equal('takeLatest(goose/test6/fourCap, fourCap)');
            const dn = rootGen.next();
            expect(dn.value).to.equal(undefined);
            expect(dn.done).to.equal(true);
        });
    });
});
