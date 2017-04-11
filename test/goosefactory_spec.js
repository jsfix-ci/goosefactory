import { expect } from 'chai';
import { takeLatest } from 'redux-saga';
import deepFreeze from 'deep-freeze';

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

describe("goosefactory", ()=> {
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


        it("...and each action creator produces new action objects in each call (doesn't recycle objects)", ()=>{
            const gooseFactory = new GooseFactory("goose/testUnique/", GOOSE_ACTIONS, undefined, true, true);
            const actions = gooseFactory.getActionCreators();

            // Expect the value of the first action object to not be affected by the creation of the second:
            const ac1 = deepFreeze(actions.woopOnce(1));
            const ac2 = deepFreeze(actions.woopOnce(4));
            expect(ac1.woop).to.equal(1);
            expect(ac2.woop).to.equal(4);

            // Uniqueness even applies to argument-less actions (and in a different way than a clone):
            const ac3 = deepFreeze(actions.awrightTwice());
            const ac3b = ac3;
            const ac4 = deepFreeze(actions.awrightTwice());
            expect(ac3b).to.equal(ac3);
            expect(ac3).to.not.equal(ac4);

            // All values behave as expected, and independently:
            const ac5 = deepFreeze(actions.twoThreeOneAwright(10,20,30));
            const ac6 = deepFreeze(actions.twoThreeOneAwright(15,20,35));
            expect(ac5.type).to.equal(ac6.type);
            expect(ac5.one).to.not.equal(ac6.one);
            expect(ac5.two).to.equal(ac6.two);
            expect(ac5.three).to.not.equal(ac6.three);
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

        it("makes sure the actiontype is sensible if prefix is null", ()=>{
            const gooseFactory = new GooseFactory(null, {
                global1: function*({woop}) {
                    console.log("woopOnce");
                    yield woop;
                },
            }, undefined, true, true);

            const types = gooseFactory.getTypes();
            expect(types.global1).to.equal("global1");
        });

        it("makes sure the actiontype is sensible if prefix is en empty string", ()=>{
            const gooseFactory = new GooseFactory("", {
                global2: function*({woop}) {
                    console.log("woopOnce");
                    yield woop;
                },
            }, undefined, true, true);

            const types = gooseFactory.getTypes();
            expect(types.global2).to.equal("global2");
        });

        it("makes sure the actiontype doesn't end up containing a double slash if prefix ends with a slash", ()=>{
            const gooseFactory = new GooseFactory("hey/", {
                ya: function*({woop}) {
                    console.log("woopOnce");
                    yield woop;
                },
            }, undefined, true, true);

            const types = gooseFactory.getTypes();
            expect(types.ya).to.equal("hey/ya");
        });

        it("makes sure the actiontype is sensible even if prefix is only a slash", ()=>{
            const gooseFactory = new GooseFactory("/", {
                global3: function*({woop}) {
                    console.log("woopOnce");
                    yield woop;
                },
            }, undefined, true, true);

            const types = gooseFactory.getTypes();
            expect(types.global3).to.equal("global3");
        });

        it("rejects non-string prefixes (other than null/undefined)", ()=>{
            expect( ()=>{
                new GooseFactory({thisIs: "wrong"}, {
                    ya: function*({woop}) {
                        console.log("woopOnce");
                        yield woop;
                    },
                }, undefined, true, true);
            }).to.throw(Error);

            expect( ()=>{
                new GooseFactory(["also", "bad"], {
                    ya: function*({woop}) {
                        console.log("woopOnce");
                        yield woop;
                    },
                }, undefined, true, true);
            }).to.throw(Error);

            expect( ()=>{
                new GooseFactory(840, {
                    ya: function*({woop}) {
                        console.log("woopOnce");
                        yield woop;
                    },
                }, undefined, true, true);
            }).to.throw(Error);

        });

        it("throws an error if all produced action types are not globally unique, " +
            "even across different duckfactories", ()=>{
            expect( ()=>{
                new GooseFactory("this/is", {
                    unique: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

                new GooseFactory("this/is", {
                    okay: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

                new GooseFactory("this/is/also", {
                    unique: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

                new GooseFactory("this/is/also", {
                    okay: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

                new GooseFactory("this/is", {
                    notUnique: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

            }).to.not.throw(Error);

            expect( ()=>{
                new GooseFactory("this/is", {
                    notUnique: function*({woop}) { console.log("woopOnce"); yield woop; },
                }, undefined, true, true);

            }).to.throw(Error);
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
