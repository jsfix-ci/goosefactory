import { expect } from 'chai';

import check from '../src/check';

const always = true;

describe("check", ()=>{

    describe(".sagaGoose checks a saga duck (a 'goose'? The creation of a saga-oriented action)", ()=>{

    // It returns true iff all these conditions are true:
    // 1. the sagaGenerator:
    //      - has no argument OR a first argument (preferrably 'action') OR the first argument is a deconstructed object, AND
    // 2. the actionArgumentNames array doesn't contain the argument name 'type', which is reserved
        it("asserts the actionCreators during the creation", ()=> {
            expect(check(
                "T_PERKELE1",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.equal(true);



            expect(check(
                "T_PERKELE2",
                ["woop", "wheee", "satanperkele"],
                function* (action){ while(always) { yield "Awright"; } }
            )).to.equal(true);



            expect(check(
                "T_PERKELE3",
                ["woop", "wheee", "satanperkele"],
                function* ({woop, wheee, satanperkele}) { while(always) { yield "Awright"; } },
            )).to.equal(true);

            // It's happy as long as the reducers's action at least gets the arguments it needs
            expect(check(
                "T_PERKELE4",
                ["woop", "wheee", "satanperkele", "excessive", "superfluous", "redundant", "unused"],
                function* ({woop, wheee, satanperkele}) { while(always) { yield "Awright"; } },
            )).to.equal(true);
        });


        it("throws an error if the argument name list contains the name 'type', since that's reserved", ()=>{
            expect( ()=>{
                check(
                    "T_PERKELE13",
                    ["woop", "good1", "type"],
                    function* ({woop, good1, type}){ while(always) { yield "Awright"; } }
                );
            } ).to.throw(Error);
        });

        it("requires the actionType to be a string or a number", ()=> {

            // String type checked in all previous tests. Not bothering with testing it here.
            expect( ()=>{
                check(
                    42,
                    ["woop", "good1"],
                    function* ({woop, good1}){ while(always) { yield "Awright"; } }
                );
            } ).to.not.throw(Error);
        });

        it("throws an error if the actionType is not a string or a number", ()=> {
            expect( ()=>{
                check(
                    null,
                    ["woop", "good1"],
                    function* ({woop, good1}){ while(always) { yield "Awright"; } }
                );
            } ).to.throw(Error);

            expect( ()=>{
                check(
                    undefined,
                    ["woop", "good1"],
                    function* ({woop, good1}){ while(always) { yield "Awright"; } }
                );
            } ).to.throw(Error);

            expect( ()=>{
                check(
                    ["hey"],
                    ["woop", "good1"],
                    function* ({woop, good1}){ while(always) { yield "Awright"; } }
                );
            } ).to.throw(Error);


            expect( ()=>{
                check(
                    {aww: "no"},
                    ["woop", "good1"],
                    function* ({woop, good1}){ while(always) { yield "Awright"; } }
                );
            } ).to.throw(Error);
        });

        it("throws an error on duplicate actionTypes between this duck/goose or any other", ()=> {
            expect( ()=>check(
                "T_PERKELE14",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.not.throw(Error);

            expect( ()=>check(
                "WHOOPSIE",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.not.throw(Error);

            expect( ()=>check(
                "T_PERKELE15",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.not.throw(Error);

            expect( ()=>check(
                "WHOOPSIE",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.throw(Error);

            expect( ()=>check(
                "T_PERKELE16",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.not.throw(Error);

            expect( ()=>check(
                "T_PERKELE16",
                ["woop", "wheee", "satanperkele"],
                function*() { while(always) { yield "Awright"; } }
            )).to.throw(Error);
        });
    });
});
