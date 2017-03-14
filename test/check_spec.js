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
            expect( ()=>{check(
                function*() { while(always) { yield "Awright"; } },
                "T_ACTION1",
                ["woop", "wheee", "ohyeah"],
            );}).to.not.throw(Error);



            expect( ()=>{check(
                function* (action){ while(always) { yield "Awright"; } },
                "T_ACTION2",
                ["woop", "wheee", "ohyeah"],
            );}).to.not.throw(Error);



            expect( ()=>{check(
                function* ({woop, wheee, ohyeah}) { while(always) { yield "Awright"; } },
                "T_ACTION3",
                ["woop", "wheee", "ohyeah"],
            );}).to.not.throw(Error);

            // It's happy as long as the reducers's action at least gets the arguments it needs
            expect( ()=>{check(
                function* ({woop, wheee, ohyeah}) { while(always) { yield "Awright"; } },
                "T_ACTION4",
                ["woop", "wheee", "ohyeah", "excessive", "superfluous", "redundant", "unused"],
            );}).to.not.throw(Error);
        });


        it("throws an error if the argument name list contains the name 'type', since that's reserved", ()=>{
            expect( ()=>{
                check(
                    function* ({woop, good1, type}){ while(always) { yield "Awright"; } },
                    "T_ACTION13",
                    ["woop", "good1", "type"],
                );
            } ).to.throw(Error);
        });


        it("throws an error if the actionType is not a string or a number", ()=> {
            expect( ()=>{
                check(
                    function* ({woop, good1}){ while(always) { yield "Awright"; } },
                    null,
                    ["woop", "good1"],
                );
            } ).to.throw(Error);

            // String type checked in all previous tests. Not bothering with testing it here.
            expect( ()=>{
                check(
                    function* ({woop, good1}){ while(always) { yield "Awright"; } },
                    42,
                    ["woop", "good1"],
                );
            } ).to.throw(Error);

            expect( ()=>{
                check(
                    function* ({woop, good1}){ while(always) { yield "Awright"; } },
                    undefined,
                    ["woop", "good1"],
                );
            } ).to.throw(Error);

            expect( ()=>{
                check(
                    function* ({woop, good1}){ while(always) { yield "Awright"; } },
                    ["hey"],
                    ["woop", "good1"],
                );
            } ).to.throw(Error);


            expect( ()=>{
                check(
                    function* ({woop, good1}){ while(always) { yield "Awright"; } },
                    {aww: "no"},
                    ["woop", "good1"],
                );
            } ).to.throw(Error);
        });

        it("throws an error on duplicate actionTypes between this duck/goose or any other", ()=> {
            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "T_ACTION14",
                ["woop", "wheee", "ohyeah"],
            )).to.not.throw(Error);

            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "WHOOPS",
                ["woop", "wheee", "ohyeah"],
            )).to.not.throw(Error);

            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "T_ACTION15",
                ["woop", "wheee", "ohyeah"],
            )).to.not.throw(Error);

            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "WHOOPS",
                ["woop", "wheee", "ohyeah"],
            )).to.throw(Error);

            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "T_ACTION16",
                ["woop", "wheee", "ohyeah"],
            )).to.not.throw(Error);

            expect( ()=>check(
                function*() { while(always) { yield "Awright"; } },
                "T_ACTION16",
                ["woop", "wheee", "ohyeah"],
            )).to.throw(Error);
        });
    });
});
