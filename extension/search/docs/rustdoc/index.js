import { loadDatabase } from "./stringdex.js";

export function isStringdexIndex(index) {
    return index?.format === "stringdex";
}

export function readStoredIndex(index) {
    return isStringdexIndex(index) ? index : new Map(index);
}

function openDatabase(root, getShard) {
    let callbacks;

    async function loadShard(path, hash, kinds, onError) {
        try {
            if (!/^(?:[a-z_][a-z_\d]*\/)?[a-f\d]{10}\.js$/i.test(path)) {
                throw new Error("Invalid Rustdoc index shard path");
            }
            const [kind, data] = await getShard(path, hash);
            if (!kinds.includes(kind) || !callbacks[kind](data)) {
                throw new Error(`Invalid Rustdoc index shard: ${path}`);
            }
        } catch (error) {
            onError(hash, error);
        }
    }

    return loadDatabase({
        loadRoot: handlers => {
            callbacks = handlers;
            try {
                callbacks.rr_(root);
            } catch (error) {
                callbacks.err_rr_(error);
            }
        },
        loadTreeByHash: hash => loadShard(`${hash}.js`, hash, ["rn_"], callbacks.err_rn_),
        loadDataByNameAndHash: (name, hash) =>
            loadShard(`${name}/${hash}.js`, hash, ["rd_", "rb_"], callbacks.err_rd_),
    });
}

export function restoreRustdocIndex({ root, shards }) {
    return openDatabase(root, (path, hash) => {
        if (!Object.hasOwn(shards, hash)) {
            throw new Error(`Missing saved Rustdoc index shard: ${path}`);
        }
        return shards[hash];
    });
}

// Rustdoc publishes each shard as a call with a single JavaScript string argument.
// Read the payload as data, using the escapes emitted by Stringdex.
export function parseIndexScript(script) {
    const call = /^\s*(rr_|rn_|rd_|rb_)\(\s*(?:"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)')\s*\)\s*;?\s*$/s.exec(script);
    if (!call) throw new Error("Invalid Rustdoc index script");

    const escapes = { "\\": "\\", '"': '"', "'": "'", n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", 0: "\0" };
    const payload = (call[2] ?? call[3]).replace(/\\(x[\da-f]{2}|u[\da-f]{4}|.)/gi, (_, escape) => {
        if (escape.length > 1) return String.fromCharCode(parseInt(escape.slice(1), 16));
        if (Object.hasOwn(escapes, escape)) return escapes[escape];
        throw new Error("Invalid escape in Rustdoc index script");
    });
    return [call[1], payload];
}

export async function loadRustdocSearchIndex(rootUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    const pending = [];
    let active = 0;

    async function fetchScript(url) {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Rustdoc index request failed (${response.status}): ${url}`);
        return parseIndexScript(await response.text());
    }

    function startNextRequest() {
        if (active >= 16 || pending.length === 0) return;
        const { url, resolve, reject } = pending.shift();
        active++;
        fetchScript(url).then(resolve, reject).finally(() => {
            active--;
            startNextRequest();
        });
    }

    try {
        const [kind, root] = await fetchScript(rootUrl);
        const { normalizedName, entry } = JSON.parse(root);
        if (kind !== "rr_" || !normalizedName?.I || !entry?.H || !entry?.N) {
            throw new Error("Unsupported Rustdoc search index");
        }
        // Rustdoc's earlier Stringdex format uses six-byte shard IDs.
        const bucketCount = Array.from(entry.N).filter(char => char.charCodeAt(0) >= 96).length;
        if (atob(entry.H).length !== bucketCount * 5) {
            throw new Error("Unsupported Stringdex shard format");
        }
        const shards = Object.create(null);
        const database = await openDatabase(root, async (path, hash) => {
            const url = new URL(path, rootUrl);
            const shard = await new Promise((resolve, reject) => {
                pending.push({ url, resolve, reject });
                startNextRequest();
            });
            shards[hash] = shard;
            return shard;
        });
        await database.preload();
        return { format: "stringdex", root, shards };
    } finally {
        clearTimeout(timeout);
        controller.abort();
    }
}
