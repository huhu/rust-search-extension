function testCrateDocSearchManager({ crateName, crateVersion, searchIndex, libName }) {
    localStorage.clear();

    describe(`crate: ${crateName}, CrateDocSearchManager`, function () {
        after(async function () {
            await CrateDocManager.removeCrate(crateName);
        });

        describe("crates", function () {
            it("getCrates()", async function () {
                (await CrateDocManager.getCrates()).should.deep.equal({});
            });
            it("addCrate()", async function () {
                await CrateDocManager.addCrate({ libName, crateVersion, searchIndex, crateName });
                let crates = await CrateDocManager.getCrates();
                Object.keys(crates).should.contains(libName);
            });
            it("getCrateByName()", async function () {
                let a = await CrateDocManager.getCrateByName(crateName);
                let b = await CrateDocManager.getCrateByName(libName);
                a.should.deep.equal(b);
            });
            it("getSearchIndex()", async function () {
                searchIndex.should.deep.equal(await CrateDocManager.getCrateSearchIndex(crateName));
                searchIndex.should.deep.equal(await CrateDocManager.getCrateSearchIndex(libName));
            });
            it("removeCrate()", async function () {
                await CrateDocManager.removeCrate(libName);
                (await CrateDocManager.getCrates()).should.deep.equal({});
            });
        });
    });
}

testCrateDocSearchManager({
    crateName: "md-5",
    crateVersion: "0.10.5",
    libName: "md5",
    searchIndex: JSON.parse('{"md5":{"doc":"An implementation of the MD5 cryptographic hash algorithm.","t":[8,6,3,11,11,10,11,11,11,2,10,10,11,10,10,10,11,11,11,10,10,10,10,11,11,11,11,11,10,11,11],"n":["Digest","Md5","Md5Core","borrow","borrow_mut","chain_update","clone","clone_into","default","digest","digest","finalize","finalize_fixed_core","finalize_into","finalize_into_reset","finalize_reset","fmt","from","into","new","new_with_prefix","output_size","reset","reset","to_owned","try_from","try_into","type_id","update","update_blocks","write_alg_name"],"q":["md5","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""],"d":["Convinience wrapper trait covering functionality of …","MD5 hasher state.","Core MD5 hasher state.","","","Process input data in a chained manner.","","","","","Compute hash of <code>data</code>.","Retrieve result and consume hasher instance.","","Write result into provided array and consume the hasher …","Write result into provided array and reset the hasher …","Retrieve result and reset hasher instance.","","Returns the argument unchanged.","Calls <code>U::from(self)</code>.","Create new hasher instance.","Create new hasher instance which has processed the …","Get output size of the hasher","Reset hasher instance to its initial state.","","","","","","Process data, updating the internal state.","",""],"i":[0,0,0,2,2,12,2,2,2,0,12,12,2,12,12,12,2,2,2,12,12,12,12,2,2,2,2,2,12,2,2],"f":[0,0,0,[[]],[[]],[1],[2,2],[[]],[[],2],0,[1,[[4,[3]]]],[[],[[4,[3]]]],[[2,5,6]],[4],[4],[[],[[4,[3]]]],[[2,7],8],[[]],[[]],[[]],[1],[[],9],[[]],[2],[[]],[[],10],[[],10],[[],11],[1],[2],[7,8]],"p":[{"ty":8,"name":"AsRef"},{"ty":3,"name":"Md5Core"},{"ty":15,"name":"u8"},{"ty":3,"name":"GenericArray"},{"ty":6,"name":"Buffer"},{"ty":6,"name":"Output"},{"ty":3,"name":"Formatter"},{"ty":6,"name":"Result"},{"ty":15,"name":"usize"},{"ty":4,"name":"Result"},{"ty":3,"name":"TypeId"},{"ty":8,"name":"Digest"}]}}'),
});

let crateName = "matches";
let crateVersion = "0.1.8";
let libName = "matches";
let searchIndex = {
    "matches": {
        "doc": "",
        "items": [
            [14, "matches", "matches", "Check if an expression matches a refutable pattern.", null, null],
            [14, "assert_matches", "", "Assert that an expression matches a refutable pattern.", null, null],
            [14, "debug_assert_matches", "", "Assert that an expression matches a refutable pattern using debug assertions.", null, null]
        ],
        "paths": []
    }
};

testCrateDocSearchManager({
    crateName, crateVersion, libName, searchIndex
});

describe("CrateDocSearch", function () {
    after(async function () {
        await CrateDocManager.removeCrate(crateName);
    });

    describe("search", function () {
        let searcher = new CrateDocSearch();
        [
            ["@match", 2],
            ["@matches", 1],
            ["@matches m", 5],
            ["@matches z", 1]
        ]
            .forEach(function ([keyword, len]) {
                it(`"${keyword}" search()`, async function () {
                    await CrateDocManager.addCrate({ libName, crateVersion, searchIndex, crateName });
                    let result = await searcher.search(keyword);
                    result.should.have.lengthOf(len);
                });
            });
    });

    describe("parseCrateDocsSearchKeyword", function () {
        [
            ["@tokio", ["tokio", ""]],
            ["@tokio spawn", ["tokio", "spawn"]],
            ["@@tokio spawn", ["tokio", "spawn"]],
            ["@tokio  spawn", ["tokio", "spawn"]],
            ["@tokio::spawn", ["tokio", "spawn"]],
            ["@tokio:spawn", ["tokio", "spawn"]],
            ["@tokio task::spawn", ["tokio", "task::spawn"]],
            ["@tokio::task::spawn", ["tokio", "task::spawn"]],
            ["@tokio  time::sleep::poll", ["tokio", "time::sleep::poll"]],
        ].forEach(function ([keyword, expected]) {
            it(`parseCrateDocsSearchKeyword("${keyword}")`, function () {
                let result = CrateDocSearch.parseCrateDocsSearchKeyword(keyword);
                result.should.deep.equal(expected);
            });
        });
    });
});