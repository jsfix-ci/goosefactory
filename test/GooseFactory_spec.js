import { expect } from 'chai';

import GooseFactory from '../src/';


const always = true;

const GOOSE_ACTIONS = {
    action1: [ ["woop", "wheee", "ohyeah"],
        function* ({woop, wheee, ohyeah}) { while (always) { yield "Awright"; } },
    ],
    action2: [ ["woop", "wheee", "ohyeah"],
        function* ({woop, wheee, ohyeah}) { while (always) { yield "Awright"; } },
    ],
    action7: [ ["woop", "wheee", "ohyeah"],
        function* ({woop, wheee, ohyeah}) {
            yield wheee;
            yield ohyeah;
            yield woop;
            yield "Awright";
        },
    ],
};
const gooseFactory = new GooseFactory("GSTST", GOOSE_ACTIONS);

describe("GooseFactory", ()=> {
    describe(".makeActionCreator", () => {
        it("uses the actioncreator to create actions as expected, with arguments", ()=>{
            const action = GOOSE_ACTIONS.action1(2, 42, 666);
            expect(action).to.deep.equal({
                type: "GSTST_action1",
                woop: 2,
                wheee: 42,
                ohyeah: 666,
            });
        });


        it("tolerates excessive number of action arguments, compared to the actionCreator actionArgumentNames", ()=>{
            const action = GOOSE_ACTIONS.action2(2, 42, 99, 47, 101);
            expect(action).to.deep.equal({
                type: "GSTST_action2",
                woop: 2,
                wheee: 42,
                ohyeah: 99,
            });
        });
    });


    describe(".getSaga", ()=>{

        const sagas = gooseFactory.getSagas();

        // Exposes the saga generator, for testing. This is how to test it.
        it("returns the type of the actions it will create", ()=>{
            const action = GOOSE_ACTIONS.action7("One", "Two", "Three");

            const triggeredSaga = sagas.GSTST_action7(action);

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
