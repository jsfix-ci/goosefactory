import { expect } from 'chai';

import GooseFactory from '../../../src/redux/duckfactory/GooseFactory';


const always = true;

const GOOSE_ACTIONS = {
    perkele1: [ ["woop", "wheee", "satanperkele"],
        function* ({woop, wheee, satanperkele}) { while (always) { yield "Awright"; } },
    ],
    perkele2: [ ["woop", "wheee", "sataniperkele"],
        function* ({woop, wheee, sataniperkele}) { while (always) { yield "Awright"; } },
    ],
    perkele7: [ ["woop", "wheee", "satanperkele"],
        function* ({woop, wheee, satanperkele}) {
            yield wheee;
            yield satanperkele;
            yield woop;
            yield "Awright";
        },
    ],
};
const gooseFactory = new GooseFactory("GSTST", GOOSE_ACTIONS);

describe("GooseFactory", ()=> {
    describe(".makeActionCreator", () => {

        describe("", ()=>{
            it("uses the actioncreator to create actions as expected, with arguments", ()=>{
                const action = GOOSE_ACTIONS.perkele1(2, 42, 666);
                expect(action).to.deep.equal({
                    type: "GSTST_perkele1",
                    woop: 2,
                    wheee: 42,
                    satanperkele: 666,
                });
            });


            it("tolerates excessive number of action arguments, compared to the actionCreator actionArgumentNames", ()=>{
                const action = GOOSE_ACTIONS.perkele2(2, 42, 99, 47, 101);
                expect(action).to.deep.equal({
                    type: "GSTST_perkele2",
                    woop: 2,
                    wheee: 42,
                    sataniperkele: 99,
                });
            });
        });


        describe(".getSaga", ()=>{

            const sagas = gooseFactory.getSagas();

            // Exposes the saga generator, for testing. This is how to test it.
            it("returns the type of the actions it will create", ()=>{
                const action = GOOSE_ACTIONS.perkele7("One", "Two", "Three");

                const triggeredSaga = sagas.GSTST_perkele7(action);

                expect(triggeredSaga.next().value).to.equal("Two");
                expect(triggeredSaga.next().value).to.equal("Three");
                expect(triggeredSaga.next().value).to.equal("One");
                expect(triggeredSaga.next().value).to.equal("Awright");

                const dn = triggeredSaga.next();
                expect(dn.value).to.equal(undefined);
                expect(dn.done).to.equal(true);
            });
        });
    });
});
