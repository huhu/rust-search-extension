// Run with node --test scripts/test-rustdoc-search.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import DocSearch from "../extension/search/docs/base.js";
import { loadRustdocSearchIndex, parseIndexScript, readStoredIndex } from "../extension/search/docs/rustdoc/index.js";
import legacyIndex from "../extension/index/std-docs.js";
import legacyDescriptions from "../extension/index/desc-shards/std.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/rustdoc-1.101-index.json", import.meta.url)));
const rootUrl = new URL("https://docs.rs/example/1.0.0/search.index/root.js");
const docsRoot = "https://docs.rs/example/1.0.0/";

test("imports the Rustdoc 1.101 index and searches saved shards offline", async t => {
    const requested = new Set();
    let shardUnavailable = true;
    const fetch = t.mock.method(globalThis, "fetch", async url => {
        const name = String(url).split("/search.index/")[1];
        requested.add(name);
        if (shardUnavailable && name.startsWith("entry/")) {
            return new Response(null, { status: 404 });
        }
        const script = fixture.files[name];
        assert.ok(script, `Unexpected index resource: ${url}`);
        return new Response(script);
    });
    await assert.rejects(loadRustdocSearchIndex(rootUrl), /404/);

    shardUnavailable = false;
    const index = await loadRustdocSearchIndex(rootUrl);
    assert.deepEqual([...requested].sort(), Object.keys(fixture.files).sort());

    fetch.mock.mockImplementation(() => assert.fail("Saved indexes must search offline"));
    const storedIndex = readStoredIndex(JSON.parse(JSON.stringify(index)));
    const searcher = new DocSearch("index_fixture", storedIndex, docsRoot, null, "index_fixture");
    const [byName] = await searcher.search("Marker::read");
    assert.equal(byName.href, `${docsRoot}index_fixture/struct.Marker.html#method.read`);
    assert.equal(byName.desc, "Read a marker.");

    const aliasHref = `${docsRoot}index_fixture/fn.make_marker.html`;
    assert.ok((await searcher.search("forge")).some(row => row.href === aliasHref));
    assert.ok((await searcher.search("u32 -> Marker")).some(row => row.href === aliasHref));
});

test("searches a previously stored legacy index", async () => {
    const searchState = {
        descShards: new Map(),
        loadDesc: ({ descShard, descIndex }) =>
            legacyDescriptions.get(descShard.crate)?.[descShard.shard]?.[descIndex],
    };
    const storedIndex = readStoredIndex(structuredClone(Array.from(legacyIndex)));
    const searcher = new DocSearch("std", storedIndex, "https://doc.rust-lang.org/stable/", searchState);
    const [result] = await searcher.search("HashMap");
    assert.equal(result.href, "https://doc.rust-lang.org/stable/std/collections/struct.HashMap.html");
    assert.match(result.desc, /hash map/);
});

test("only reads Rustdoc data callbacks", () => {
    assert.deepEqual(parseIndexScript('rd_("a\\x27b")'), ["rd_", "a'b"]);
    assert.throws(() => parseIndexScript('rn_("data"); run();'), /Invalid Rustdoc index script/);
});
