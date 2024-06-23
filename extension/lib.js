import settings from "./settings.js";
import Statistics from "./statistics.js";
import HistoryCommand from "./core/command/history.js";
import CrateDocManager from "./crate-manager.js";
import { Compat } from "./core/index.js";
import {
    LINT_URL,
    REDIRECT_URL,
} from "./constants.js";

export async function getBaseUrl() {
    let isOfflineMode = await settings.isOfflineMode;
    return isOfflineMode ? await settings.offlineDocPath : 'https://doc.rust-lang.org/';
}

export class RustSearchOmnibox {
    static async run({
        omnibox,
        stdSearcher,
        nightlySearcher,
        crateDocSearcher,
        crateSearcher,
        attributeSearcher,
        bookSearcher,
        caniuseSearcher,
        lintSearcher,
        commandManager,
    }) {
        function formatDoc(index, doc) {
            let content = doc.href;
            let description = doc.displayPath + `<match>${doc.name}</match>`;
            if (doc.desc) {
                description += ` - <dim>${Compat.escape(Compat.eliminateTags(doc.desc))}</dim>`;
            }

            return { content, description };
        }

        function wrapCrateSearchAppendix(appendix) {
            return [
                appendix,
                {
                    content: "remind",
                    description: `Remind: <dim>We only indexed the top 20K crates. Sorry for the inconvenience if your desired crate not show.</dim>`,
                },
            ];
        }

        omnibox.bootstrap({
            onSearch: async (query) => {
                return await stdSearcher.search(query);
            },
            onFormat: formatDoc,
            onAppend: async (query) => {
                return [{
                    content: await stdSearcher.getSearchUrl(query),
                    description: `Search Rust docs <match>${query}</match> on ${await settings.isOfflineMode ? "offline mode" : await stdSearcher.rootPath}`,
                }];
            },
            onEmptyNavigate: (content, disposition) => {
                commandManager.handleCommandEnterEvent(content, disposition);
            },
            beforeNavigate: async (query, content) => {
                if (content && /^@\w+$/i.test(content.trim())) {
                    // Case: @crate, redirect to that crate's docs.rs page
                    return `https://docs.rs/${content.replace("@", "")}`;
                } else if (content && /^https?.*\/~\/\*\/.*/ig.test(content)) {
                    // Sanitize docs url which from all crates doc search mode. (Prefix with "~")
                    // Here is the url instance: https://docs.rs/~/*/reqwest/fn.get.html
                    let [_, __, libName] = new URL(content).pathname.slice(1).split("/");
                    let crate = await CrateDocManager.getCrateByName(libName);
                    const crateVersion = await settings.keepCratesUpToDate ? "latest" : crate.version;
                    return content.replace("/~/", `/${crate.crateName || libName}/`).replace("/*/", `/${crateVersion}/`);
                } else {
                    return content;
                }
            },
            afterNavigated: async (query, result) => {
                // Ignore the command history
                if (query?.startsWith(":")) return;

                // Only keep the latest 100 of search history.
                let historyItem = await HistoryCommand.record(query, result, 100);
                let statistics = await Statistics.load();
                await statistics.record(historyItem, true);
            },
        });

        omnibox.addRegexQueryEvent(/^s(?:rc)?:/i, {
            name: "Source code",
            onSearch: async (query) => {
                query = query.replace(/^s(?:rc)?:/i, "");
                return await stdSearcher.search(query);
            },
            onFormat: (index, doc) => {
                let { content, description } = formatDoc(index, doc);
                let url = new URL(doc.href);
                url.search = "?mode=src";
                content = url.toString();
                description = `[Source code] ${description}`;
                return { content, description };
            },
            onAppend: async (query) => {
                return [{
                    content: await stdSearcher.getSearchUrl(query),
                    description: `Search Rust docs <match>${query}</match> on ${await settings.isOfflineMode ? "offline mode" : await stdSearcher.rootPath}`,
                }];
            },
        });

        // Nightly std docs search
        omnibox.addPrefixQueryEvent("/", {
            name: "Nightly docs",
            onSearch: async (query) => {
                query = query.replaceAll("/", "").trim();
                return await nightlySearcher.search(query);
            },
            onFormat: (index, doc) => {
                let { content, description } = formatDoc(index, doc);
                return { content, description: '[Nightly] ' + description };
            },
            onAppend: async (query) => {
                query = query.replaceAll("/", "").trim();
                return [{
                    content: await nightlySearcher.getSearchUrl(query),
                    description: `Search nightly Rust docs <match>${query}</match> on ${nightlySearcher.rootPath}`,
                }];
            },
        });

        omnibox.addPrefixQueryEvent("~", {
            name: "External docs",
            isDefaultSearch: async () => {
                return (await settings.defaultSearch).thirdPartyDocs;
            },
            searchPriority: 1,
            onSearch: async (query) => {
                return await crateDocSearcher.searchAll(query);
            },
            onFormat: formatDoc,
        });

        omnibox.addPrefixQueryEvent("@", {
            name: "Crate docs",
            onSearch: async (query) => {
                return await crateDocSearcher.search(query);
            },
            onFormat: (index, item) => {
                if ('content' in item) {
                    // 1. Crate list header.
                    // 2. Crate result footer
                    return item;
                } else if ('href' in item) {
                    return formatDoc(index, item);
                } else {
                    // Crate name list.
                    let content = `@${item.name}`;
                    return {
                        content,
                        description: `<match>${content}</match> v${item.version} - <dim>${Compat.escape(Compat.eliminateTags(item.doc))}</dim>`,
                    };
                }
            },
            onAppend: () => {
                return [{
                    content: chrome.runtime.getURL("manage/crates.html"),
                    description: `Remind: <dim>Select here to manage all your indexed crates</dim>`,
                }];
            },
        });

        omnibox.addPrefixQueryEvent("!", {
            name: "docs.rs",
            isDefaultSearch: async () => {
                return (await settings.defaultSearch).docsRs;
            },
            searchPriority: 2,
            onSearch: (query) => {
                return crateSearcher.search(query);
            },
            onFormat: (index, crate) => {
                return {
                    content: `https://docs.rs/${crate.id}`,
                    description: `${Compat.capitalize("docs.rs")}: <match>${crate.id}</match> v${crate.version} - <dim>${Compat.escape(Compat.eliminateTags(crate.description))}</dim>`,
                };
            },
            onAppend: (query) => {
                let keyword = query.replace(/[!\s]/g, "");
                return wrapCrateSearchAppendix({
                    content: "https://docs.rs/releases/search?query=" + encodeURIComponent(keyword),
                    description: "Search Rust crates for " + `<match>${keyword}</match>` + " on https://docs.rs",
                });
            },
        });

        omnibox.addPrefixQueryEvent("!!", {
            name: "crates.io",
            onSearch: (query) => {
                return crateSearcher.search(query);
            },
            onFormat: async (index, crate) => {
                let crateRegistry = await settings.crateRegistry;
                return {
                    content: `https://${crateRegistry}/crates/${crate.id}`,
                    description: `${Compat.capitalize(crateRegistry)}: <match>${crate.id}</match> v${crate.version} - <dim>${Compat.escape(Compat.eliminateTags(crate.description))}</dim>`,
                };
            },
            onAppend: async (query) => {
                let crateRegistry = await settings.crateRegistry;
                let keyword = query.replace(/[!\s]/g, "");
                return wrapCrateSearchAppendix({
                    content: `https://${crateRegistry}/search?q=` + encodeURIComponent(keyword),
                    description: "Search Rust crates for " + `<match>${keyword}</match>` + ` on https://${crateRegistry}`,
                });
            },
        });

        omnibox.addPrefixQueryEvent("!!!", {
            name: "Repository",
            onSearch: (query) => {
                return crateSearcher.search(query);
            },
            onFormat: (index, crate) => {
                return {
                    content: `${REDIRECT_URL}?crate=${crate.id}`,
                    description: `${Compat.capitalize("repository")}: <match>${crate.id}</match> v${crate.version} - <dim>${Compat.escape(Compat.eliminateTags(crate.description))}</dim>`,
                };
            },
            onAppend: (query) => {
                let keyword = query.replace(/[!\s]/g, "");
                return wrapCrateSearchAppendix({
                    content: "https://github.com/search?q=" + encodeURIComponent(keyword),
                    description: "Search Rust crates for " + `<match>${keyword}</match>` + " on https://github.com",
                });
            },
        });

        omnibox.addPrefixQueryEvent("#", {
            name: "Attributes",
            isDefaultSearch: async () => {
                return (await settings.defaultSearch).attributes;
            },
            searchPriority: 3,
            onSearch: (query) => {
                query = query.replace(/[[\]]/g, "");
                return attributeSearcher.search(query);
            },
            onFormat: (index, attribute) => {
                return {
                    content: attribute.href,
                    description: `Attribute: <match>#[${attribute.name}]</match> <dim>${Compat.escape(attribute.description)}</dim>`,
                };
            },
        });

        omnibox.addPrefixQueryEvent("?", {
            name: "Can I use",
            onSearch: (query) => {
                return caniuseSearcher.search(query);
            },
            onFormat: (index, feat, query) => {
                return {
                    content: `https://caniuse.rs/features/${feat.slug}`,
                    description: `Can I use: <match>${Compat.escape(feat.match)}</match> [${feat.version}] - <dim>${Compat.escape(feat.description)}</dim>`
                };
            },
            onAppend: () => {
                return [{
                    content: ":rfc",
                    description: `Remind: <dim>you can use</dim> :rfc <dim>command to search all Rust RFCs.</dim>`,
                }];
            },
        });

        omnibox.addRegexQueryEvent(/^`?e\d{2,4}`?$/i, {
            name: "Error code",
            onSearch: async (query) => {
                query = query.replace("`", "");
                let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));
                let result = [];
                for (let i = 0; i < 10; i++) {
                    let errorIndex = 'E' + String(baseIndex++).padStart(4, "0").toUpperCase();
                    result.push(errorIndex);
                }

                let baseUrl = await getBaseUrl();
                return result.map(errorCode => {
                    return {
                        content: `${baseUrl}error_codes/${errorCode}.html`,
                        description: `Open error code <match>${errorCode}</match> on error codes index`,
                    };
                });
            },
        });

        omnibox.addPrefixQueryEvent("%", {
            name: "Books",
            onSearch: (query) => {
                return bookSearcher.search(query);
            },
            onFormat: (index, page) => {
                let parentTitles = page.parentTitles || [];
                return {
                    content: page.url,
                    description: `${[...parentTitles.map(t => Compat.escape(t)), `<match>${Compat.escape(page.title)}</match>`].join(" > ")} - <dim>${page.name}</dim>`
                }
            },
            onAppend: () => {
                return [{
                    content: ":book",
                    description: `Remind: <dim>you can use</dim> :book <dim>command to search all Rust books.</dim>`,
                }];
            },
        });

        omnibox.addPrefixQueryEvent(">", {
            name: "Clippy lints",
            onSearch: (query) => {
                return lintSearcher.search(query);
            },
            onFormat: (_, lint) => {
                return {
                    content: `${LINT_URL}#${lint.name}`,
                    description: `Clippy lint: [${lint.level}] <match>${lint.name}</match> - <dim>${Compat.escape(Compat.eliminateTags(lint.description))}</dim>`,
                }
            },
        });

        omnibox.addPrefixQueryEvent(":", {
            name: "Commands",
            onSearch: async (query) => {
                return commandManager.execute(query);
            },
        });

    }
}