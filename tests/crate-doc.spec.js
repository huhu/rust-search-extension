let crateName = "matches";
let crateVersion = "0.1.8";
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

describe("CrateDocSearchManager", function() {
    after(function() {
        CrateDocManager.removeCrate(crateName);
    });

    describe("crates", function() {
        it("getCrates()", function() {
            CrateDocManager.getCrates().should.deep.equal({});
        });
        it("addCrate()", function() {
            CrateDocManager.addCrate(crateName, crateVersion, searchIndex);
            let crates = CrateDocManager.getCrates();
            Object.keys(crates).should.contains(crateName);
        });
        it("getSearchIndex()", function() {
            let searchIndex = CrateDocManager.getCrateSearchIndex(crateName);
            searchIndex.should.deep.equal(searchIndex);
        });
        it("removeCrate()", function() {
            CrateDocManager.removeCrate(crateName);
            CrateDocManager.getCrates().should.deep.equal({});
        });
    });
});

describe("CrateDocSearch", function() {
    after(function() {
        CrateDocManager.removeCrate(crateName);
    });

    describe("search", function() {
        let searcher = new CrateDocSearch();
        [
            ["@match", 2],
            ["@matches", 1],
            ["@matches m", 5],
            ["@matches z", 1]
        ]
        .forEach(function([keyword, len]) {
            it(`"${keyword}" search()`, function() {
                CrateDocManager.addCrate(crateName, crateVersion, searchIndex);
                let result = searcher.search(keyword);
                result.should.have.lengthOf(len);
            });
        });
    });

    describe("parseCrateDocsSearchKeyword", function() {
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
        ].forEach(function([keyword, expected]) {
            it(`parseCrateDocsSearchKeyword("${keyword}")`, function() {
                let result = CrateDocSearch.parseCrateDocsSearchKeyword(keyword);
                result.should.deep.equal(expected);
            });
        });
    });
});