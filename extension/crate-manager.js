import storage from "./core/storage.js";
import { saveDocIndex } from "./index-setter.js";
import { readStoredIndex } from "./search/docs/rustdoc/index.js";

export default class CrateDocManager {
    static async getCrates() {
        return await storage.getItem("crates") || {};
    }

    static async getCrateEntry(name) {
        const crates = await CrateDocManager.getCrates();
        return Object.hasOwn(crates, name) ? [name, crates[name]] :
            Object.entries(crates).find(([, crate]) => crate.crateName === name);
    }

    // The name can be the crate name or the Rust library name.
    static async getCrateByName(name) {
        const entry = await CrateDocManager.getCrateEntry(name);
        return entry?.[1] ?? null;
    }

    // The `name` cloud be crateName or libName.
    static async getCrateSearchIndex(name) {
        let searchIndex = await storage.getItem(`@${name}`);
        if (searchIndex) {
            return readStoredIndex(searchIndex);
        }
        const entry = await CrateDocManager.getCrateEntry(name);
        return entry ? readStoredIndex(await storage.getItem(`@${entry[0]}`)) : null;
    }

    // Some corner cases the crateName different to libName:
    // 1. https://docs.rs/actix-web/3.2.0/actix_web/
    // 2. https://docs.rs/md-5/0.10.5/md5/
    // 
    // Here is the rule: https://docs.rs/{crateName}/{crateVersion}/{libName}
    static async addCrate({ libName, crateVersion, crateTitle, searchIndex, crateName, descShards }) {
        const crates = await CrateDocManager.getCrates();
        const items = {
            [`@${libName}`]: searchIndex,
            crates: {
                ...crates,
                [libName]: {
                    version: crateVersion,
                    doc: crateTitle,
                    time: crates[libName]?.time ?? Date.now(),
                    crateName,
                },
            },
        };
        if (descShards) items[`desc-shards-${libName}`] = descShards;
        await saveDocIndex(items);
    }

    static async removeCrate(name) {
        let crates = await CrateDocManager.getCrates();
        delete crates[name];
        await storage.setItem("crates", crates);
        await storage.removeItem(`@${name}`);
        await storage.removeItem(`desc-shards-${name}`);
    }
};
