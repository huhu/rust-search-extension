import storage from "./core/storage.js";
import IndexSetter from "./index-setter.js";

export default class CrateDocManager {
    static async getCrates() {
        return await storage.getItem("crates") || {};
    }

    // The `name` cloud be crateName or libName.
    static async getCrateEntryByName(name) {
        let crates = await CrateDocManager.getCrates();
        if (crates[name]) {
            return [name, crates[name]];
        }

        let crate = Object.entries(crates).find(([_, { crateName }]) => crateName === name);
        return crate || null;
    }

    // The `name` cloud be crateName or libName.
    static async getCrateByName(name) {
        let crate = await CrateDocManager.getCrateEntryByName(name);
        return crate ? crate[1] : null;
    }

    // The `name` cloud be crateName or libName.
    static async getCrateSearchMetadata(name) {
        let crate = await CrateDocManager.getCrateEntryByName(name);
        if (!crate) {
            return null;
        }

        return {
            libName: crate[0],
            ...crate[1],
        };
    }

    // The `name` cloud be crateName or libName.
    static async updateCrateSearchMetadataFromDocsRs(name) {
        const crateEntry = await CrateDocManager.getCrateEntryByName(name);
        if (!crateEntry) {
            return null;
        }

        const [libName, crate] = crateEntry;
        const crateName = crate.crateName || libName;
        const response = await fetch(`https://docs.rs/${crateName}/latest/${libName}/`);
        if (!response.ok) {
            return { libName, ...crate };
        }

        const html = await response.text();
        const metadata = CrateDocManager.parseRustdocSearchMetadata(html, response.url);
        if (!metadata) {
            return { libName, ...crate };
        }

        const crates = await CrateDocManager.getCrates();
        const updated = Object.fromEntries(Object.entries({
            ...crate,
            ...metadata,
            version: CrateDocManager.parseCrateVersionFromHTML(html) || crate.version,
            doc: CrateDocManager.parseCrateDescriptionFromHTML(html) || crate.doc,
            crateName,
            time: crate.time,
        }).filter(([_, value]) => value !== undefined));
        crates[libName] = updated;
        await storage.setItem("crates", crates);
        return { libName, ...updated };
    }

    static parseRustdocSearchMetadata(html, pageUrl) {
        const meta = html.match(/<meta\b(?=[^>]*\bname=["']rustdoc-vars["'])[^>]*>/i)?.[0];
        if (!meta) {
            return null;
        }

        const rootPath = CrateDocManager.parseHTMLAttribute(meta, "data-root-path");
        const staticRootPath = CrateDocManager.parseHTMLAttribute(meta, "data-static-root-path");
        const stringdexJs = CrateDocManager.parseHTMLAttribute(meta, "data-stringdex-js");
        const resourceSuffix = CrateDocManager.parseHTMLAttribute(meta, "data-resource-suffix");
        if (!rootPath || !staticRootPath || !stringdexJs || !resourceSuffix) {
            return null;
        }

        return {
            rootPath: new URL(rootPath, pageUrl).href,
            stringdexUrl: new URL(stringdexJs, new URL(staticRootPath, pageUrl)).href,
            rootIndexUrl: new URL(
                `${rootPath}search.index/root${resourceSuffix}.js`,
                pageUrl,
            ).href,
            searchIndexBaseUrl: new URL(`${rootPath}search.index/`, pageUrl).href,
            rustdocVersion: CrateDocManager.parseHTMLAttribute(meta, "data-rustdoc-version"),
            resourceSuffix,
        };
    }

    static parseCrateVersionFromHTML(html) {
        const metadata = html.match(
            /<script\b(?=[^>]*\bid=["']crate-metadata["'])[^>]*>([\s\S]*?)<\/script>/i,
        )?.[1];
        if (!metadata) {
            return null;
        }

        try {
            return JSON.parse(metadata).version || null;
        } catch (e) {
            return null;
        }
    }

    static parseCrateDescriptionFromHTML(html) {
        const meta = html.match(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i)?.[0];
        return meta ? CrateDocManager.parseHTMLAttribute(meta, "content") : null;
    }

    static parseHTMLAttribute(html, attr) {
        const match = html.match(new RegExp(`\\b${attr}=(["'])(.*?)\\1`, "i"));
        return match ? CrateDocManager.decodeHTML(match[2]) : null;
    }

    static decodeHTML(value) {
        return value.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
            switch (entity.toLowerCase()) {
                case "amp":
                    return "&";
                case "lt":
                    return "<";
                case "gt":
                    return ">";
                case "quot":
                    return "\"";
                case "apos":
                    return "'";
                default: {
                    const isHex = entity[1]?.toLowerCase() === "x";
                    const rawCodePoint = isHex ? entity.slice(2) : entity.slice(1);
                    const codePoint = parseInt(rawCodePoint, isHex ? 16 : 10);
                    return Number.isNaN(codePoint) ? `&${entity};` : String.fromCodePoint(codePoint);
                }
            }
        });
    }

    // The `name` cloud be crateName or libName.
    static async getCrateSearchIndex(name) {
        let searchIndex = await storage.getItem(`@${name}`);
        if (searchIndex) {
            return new Map(searchIndex);
        } else {
            let crates = await CrateDocManager.getCrates();
            let crate = Object.entries(crates).find(([_, { crateName }]) => crateName === name);
            if (crate) {
                let libName = crate[0];
                return new Map(await storage.getItem(`@${libName}`) || []);
            } else {
                return null;
            }
        }
    }

    // Some corner cases the crateName different to libName:
    // 1. https://docs.rs/actix-web/3.2.0/actix_web/
    // 2. https://docs.rs/md-5/0.10.5/md5/
    //
    // Here is the rule: https://docs.rs/{crateName}/{crateVersion}/{libName}
    static async addCrate({
        libName,
        crateVersion,
        crateTitle,
        searchIndex,
        crateName,
        descShards,
        rootPath,
        stringdexUrl,
        rootIndexUrl,
        searchIndexBaseUrl,
        rustdocVersion,
        resourceSuffix,
    }) {
        if (searchIndex) {
            await storage.setItem(`@${libName}`, searchIndex);
        } else {
            await storage.removeItem(`@${libName}`);
        }
        let doc = crateTitle;
        let crates = await CrateDocManager.getCrates();
        let crate = {
            version: crateVersion,
            doc,
            time: Date.now(),
            crateName,
            rootPath,
            stringdexUrl,
            rootIndexUrl,
            searchIndexBaseUrl,
            rustdocVersion,
            resourceSuffix,
        };
        if (libName in crates) {
            // Don't override the time if the crate exists
            crate.time = crates[libName].time;
        }
        crates[libName] = Object.fromEntries(
            Object.entries(crate).filter(([_, value]) => value !== undefined),
        );
        await storage.setItem("crates", crates);
        IndexSetter.setDescShards(libName, descShards);
    }

    static async removeCrate(name) {
        let crates = await CrateDocManager.getCrates();
        delete crates[name];
        await storage.setItem("crates", crates);
        await storage.removeItem(`@${name}`);
        await storage.removeItem(`desc-shards-${name}`);
    }
};
