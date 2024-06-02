import storage from "./core/storage.js";
import settings from "./settings.js";
import Statistics from "./statistics.js";
import attributesIndex from "./index/attributes.js";
import IndexManager from "./index-manager.js";
import CrateSearch from "./search/crate.js";
import CaniuseSearch from "./search/caniuse.js";
import BookSearch from "./search/book.js";
import LintSearch from "./search/lint.js";
import AttributeSearch from "./search/attribute.js";
import DocSearch from "./search/docs/base.js";
import CrateDocSearch from "./search/docs/crate-doc.js";
import RustcSearch from "./search/docs/rustc.js";
import LabelCommand from "./command/label.js";
import RfcCommand from "./command/rfc.js";
import RustcCommand from "./command/rustc.js";
import TargetCommand from "./command/target.js";
import HelpCommand from "./command/help.js";
import StableCommand from "./command/stable.js";
import SimpleCommand from "./core/command/simple.js";
import OpenCommand from "./core/command/open.js";
import HistoryCommand from "./core/command/history.js";
import CommandManager from "./core/command/manager.js";
import CrateDocManager from "./crate-manager.js";
import { Omnibox, c } from "./core/index.js";

const INDEX_UPDATE_URL = "https://rust.extension.sh/update";
const RUST_RELEASE_README_URL = "https://github.com/rust-lang/rust/blob/master/RELEASES.md";

// Get the information about the current platform os.
// Possible os values: "mac", "win", "android", "cros", "linux", or "openbsd"
function getPlatformOs() {
    return new Promise(resolve => {
        chrome.runtime.getPlatformInfo(platformInfo => {
            resolve(platformInfo.os);
        });
    });
}

async function start(el, placeholder) {
    const defaultSuggestion = `Search std <match>docs</match>, external <match>docs</match> (~,@), <match>crates</match> (!), <match>attributes</match> (#), <match>books</match> (%), clippy <match>lints</match> (>), and <match>error codes</match>, etc in your address bar instantly!`;
    const omnibox = new Omnibox({ el, defaultSuggestion: placeholder || defaultSuggestion, maxSuggestionSize: c.omniboxPageSize() });

    // All dynamic setting items. Those items will been updated
    // in chrome.storage.onchange listener callback.
    let isOfflineMode = await settings.isOfflineMode;
    let offlineDocPath = await settings.offlineDocPath;
    let defaultSearch = await settings.defaultSearch;
    let crateRegistry = await settings.crateRegistry;

    const os = await getPlatformOs();
    const crateSearcher = new CrateSearch(await IndexManager.getCrateMapping(), await IndexManager.getCrateIndex());
    let caniuseSearcher = new CaniuseSearch(await IndexManager.getCaniuseIndex());
    let bookSearcher = new BookSearch(await IndexManager.getBookIndex());
    let lintSearcher = new LintSearch(await IndexManager.getLintIndex());

    const attributeSearcher = new AttributeSearch(attributesIndex);
    const crateDocSearcher = new CrateDocSearch();

    const commandIndex = await IndexManager.getCommandIndex();
    let labelCommand = new LabelCommand(await IndexManager.getLabelIndex());
    let rfcCommand = new RfcCommand(await IndexManager.getRfcIndex());
    let rustcCommand = new RustcCommand(await IndexManager.getRustcIndex());
    let targetCommand = new TargetCommand(await IndexManager.getTargetIndex());
    const cargoCommand = new SimpleCommand('cargo', 'Search useful third-party cargo subcommands.', commandIndex['cargo']);
    const bookCommand = new SimpleCommand('book', 'Search Rust books.', commandIndex['book']);
    const bookZhCommand = new SimpleCommand('book/zh', 'Search Chinese Rust books.', commandIndex['book/zh']);
    const yetCommand = new SimpleCommand('yet', 'Search Are We Yet websites.', commandIndex['yet']);
    const toolCommand = new SimpleCommand('tool', 'Show some most useful Rust tools.', commandIndex['tool']);
    const mirrorCommand = new SimpleCommand('mirror', 'Search Rust mirror websites.', commandIndex['mirror']);

    const commandManager = new CommandManager(
        cargoCommand,
        bookCommand,
        bookZhCommand,
        yetCommand,
        toolCommand,
        mirrorCommand,
        labelCommand,
        rfcCommand,
        rustcCommand,
        targetCommand,
        new HelpCommand(),
        new StableCommand(),
        new HistoryCommand(),
        new OpenCommand('stats', 'Open search statistics page.',
            chrome.runtime.getURL("manage/index.html"), {
            content: ':stats',
            description: `Press <match>Enter</match> to open search statistics page.`,
        }),
        new OpenCommand('update', 'Update to the latest search index.',
            INDEX_UPDATE_URL, {
            content: ':update',
            description: `Press <match>Enter</match> to open search-index update page.`,
        }),
        new OpenCommand('release', 'Open rust-lang repository release page.',
            RUST_RELEASE_README_URL, {
            content: ':release',
            description: `Press <match>Enter</match> to open rust-lang repository release page.`,
        }),
    );

    let stdSearcher = new DocSearch("std", await IndexManager.getStdStableIndex(), () => {
        return isOfflineMode ? offlineDocPath : "https://doc.rust-lang.org/";
    });
    let nightlySearcher = new DocSearch("std", await IndexManager.getStdNightlyIndex(), () => {
        // Nightly docs doesn't support offline mode yet.
        return "https://doc.rust-lang.org/nightly/";
    });
    let rustcSearcher = new RustcSearch();

    let formatDoc = (index, doc) => {
        let content = doc.href;
        if (isOfflineMode && os === "win") {
            // Replace all "/" to "\" for Windows in offline mode.
            content.replaceAll("/", "\\");
        }

        let description = doc.displayPath + `<match>${doc.name}</match>`;
        if (doc.desc) {
            description += ` - <dim>${c.escape(c.eliminateTags(doc.desc))}</dim>`;
        }

        if (doc.queryType === "s" || doc.queryType === "src") {
            let url = new URL(doc.href);
            url.search = "?mode=src";
            content = url.toString();
            description = `[Source code] ${description}`;
        }
        return { content, description };
    };

    omnibox.bootstrap({
        onSearch: (query) => {
            return stdSearcher.search(query);
        },
        onFormat: formatDoc,
        onAppend: (query) => {
            return [{
                content: stdSearcher.getSearchUrl(query),
                description: `Search Rust docs <match>${query}</match> on ${isOfflineMode ? "offline mode" : stdSearcher.getRootPath()}`,
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

    // Nightly std docs search
    omnibox.addPrefixQueryEvent("/", {
        onSearch: (query) => {
            query = query.replaceAll("/", "").trim();
            return nightlySearcher.search(query);
        },
        onFormat: (index, doc) => {
            let { content, description } = formatDoc(index, doc);
            return { content, description: '[Nightly] ' + description };
        },
        onAppend: (query) => {
            query = query.replaceAll("/", "").trim();
            return [{
                content: nightlySearcher.getSearchUrl(query),
                description: `Search nightly Rust docs <match>${query}</match> on ${nightlySearcher.getRootPath()}`,
            }];
        },
    });

    // Nightly rustc docs search
    omnibox.addPrefixQueryEvent("//", {
        onSearch: (query) => {
            query = query.replaceAll("/", "").trim();
            return rustcSearcher.search(query);
        },
        onFormat: (index, doc) => {
            let { content, description } = formatDoc(index, doc);
            return { content, description: '[Rustc] ' + description };
        },
        onAppend: (query) => {
            query = query.replaceAll("/", "").trim();
            let appendix = {
                content: rustcSearcher.getSearchUrl(query),
                description: `Search nightly rustc docs <match>${query}</match> on ${rustcSearcher.getRootPath()}`,
            };
            if (rustcSearcher?.searchIndex?.length > 0) {
                return [appendix];
            } else {
                return [
                    appendix,
                    {
                        content: rustcSearcher.getRootPath(),
                        description: "To search nightly rustc docs on the address bar, please open the nightly rustc docs page in advance.",
                    },
                ];
            }
        },
    });

    omnibox.addPrefixQueryEvent("~", {
        isDefaultSearch: () => {
            return defaultSearch.thirdPartyDocs;
        },
        searchPriority: 1,
        onSearch: async (query) => {
            return await crateDocSearcher.searchAll(query);
        },
        onFormat: formatDoc,
    });

    omnibox.addPrefixQueryEvent("@", {
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
                    description: `<match>${content}</match> v${item.version} - <dim>${c.escape(c.eliminateTags(item.doc))}</dim>`,
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

    function wrapCrateSearchAppendix(appendix) {
        return [
            appendix,
            {
                content: "remind",
                description: `Remind: <dim>We only indexed the top 20K crates. Sorry for the inconvenience if your desired crate not show.</dim>`,
            },
        ];
    }

    omnibox.addPrefixQueryEvent("!", {
        isDefaultSearch: () => {
            return defaultSearch.docsRs;
        },
        searchPriority: 2,
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `https://docs.rs/${crate.id}`,
                description: `${c.capitalize("docs.rs")}: <match>${crate.id}</match> v${crate.version} - <dim>${c.escape(c.eliminateTags(crate.description))}</dim>`,
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
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `https://${crateRegistry}/crates/${crate.id}`,
                description: `${c.capitalize(crateRegistry)}: <match>${crate.id}</match> v${crate.version} - <dim>${c.escape(c.eliminateTags(crate.description))}</dim>`,
            };
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            return wrapCrateSearchAppendix({
                content: `https://${crateRegistry}/search?q=` + encodeURIComponent(keyword),
                description: "Search Rust crates for " + `<match>${keyword}</match>` + ` on https://${crateRegistry}`,
            });
        },
    });

    const REDIRECT_URL = chrome.runtime.getURL("manage/redirect.html");
    omnibox.addPrefixQueryEvent("!!!", {
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `${REDIRECT_URL}?crate=${crate.id}`,
                description: `${c.capitalize("repository")}: <match>${crate.id}</match> v${crate.version} - <dim>${c.escape(c.eliminateTags(crate.description))}</dim>`,
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
        isDefaultSearch: () => {
            return defaultSearch.attributes;
        },
        searchPriority: 3,
        onSearch: (query) => {
            query = query.replace(/[[\]]/g, "");
            return attributeSearcher.search(query);
        },
        onFormat: (index, attribute) => {
            return {
                content: attribute.href,
                description: `Attribute: <match>#[${attribute.name}]</match> <dim>${c.escape(attribute.description)}</dim>`,
            };
        },
    });

    omnibox.addPrefixQueryEvent("?", {
        onSearch: (query) => {
            return caniuseSearcher.search(query);
        },
        onFormat: (index, feat, query) => {
            return {
                content: `https://caniuse.rs/features/${feat.slug}`,
                description: `Can I use: <match>${c.escape(feat.match)}</match> [${feat.version}] - <dim>${c.escape(feat.description)}</dim>`
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
        onSearch: (query) => {
            query = query.replace("`", "");
            let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));
            let result = [];
            for (let i = 0; i < 10; i++) {
                let errorIndex = 'E' + String(baseIndex++).padStart(4, "0").toUpperCase();
                result.push(errorIndex);
            }
            let baseUrl = isOfflineMode ? offlineDocPath : 'https://doc.rust-lang.org/';
            return result.map(errorCode => {
                return {
                    content: `${baseUrl}error_codes/${errorCode}.html`,
                    description: `Open error code <match>${errorCode}</match> on ${isOfflineMode ? 'offline mode' : 'https://doc.rust-lang.org/error_codes/error-index.html'}`,
                };
            });
        },
    });

    omnibox.addPrefixQueryEvent("%", {
        onSearch: (query) => {
            return bookSearcher.search(query);
        },
        onFormat: (index, page) => {
            let parentTitles = page.parentTitles || [];
            return {
                content: page.url,
                description: `${[...parentTitles.map(t => c.escape(t)), `<match>${c.escape(page.title)}</match>`].join(" > ")} - <dim>${page.name}</dim>`
            }
        },
        onAppend: () => {
            return [{
                content: ":book",
                description: `Remind: <dim>you can use</dim> :book <dim>command to search all Rust books.</dim>`,
            }];
        },
    });

    const LINT_URL = "https://rust-lang.github.io/rust-clippy/master/";
    omnibox.addPrefixQueryEvent(">", {
        onSearch: (query) => {
            return lintSearcher.search(query);
        },
        onFormat: (_, lint) => {
            return {
                content: `${LINT_URL}#${lint.name}`,
                description: `Clippy lint: [${lint.level}] <match>${lint.name}</match> - <dim>${c.escape(c.eliminateTags(lint.description))}</dim>`,
            }
        },
    });

    omnibox.addPrefixQueryEvent(":", {
        onSearch: async (query) => {
            return commandManager.execute(query);
        },
    });

    omnibox.addNoCacheQueries("/", "!", "@", ":");

    // Skip following code if `el` provide, which mean this function run in webpage.
    if (el) return;

    // DO NOT USE ASYNC CALLBACK HERE, SEE THIS ISSUE:
    // https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-918076049
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            // Rustc:* action is exclusive to rustc docs event
            case "rustc:check": {
                sendResponse({
                    version: rustcSearcher.version,
                });
                break;
            }
            case "rustc:add": {
                if (message.searchIndex) {
                    rustcSearcher.setSearchIndex(message.searchIndex);
                    rustcSearcher.setVersion(message.version);
                    sendResponse(true);
                } else {
                    sendResponse(false);
                }
                break;
            }
            case "open-url": {
                if (message.url) {
                    Omnibox.navigateToUrl(message.url);
                }
                break;
            }
        }
        return true;
    });

    chrome.storage.onChanged.addListener(changes => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log('storage key updated:', key);
            switch (key) {
                case "offline-mode": {
                    isOfflineMode = newValue;
                    break;
                }
                case "offline-path": {
                    offlineDocPath = newValue;
                    break;
                }
                case "default-search": {
                    defaultSearch = newValue;
                    break;
                }
                case "crate-registry": {
                    crateRegistry = newValue;
                    break;
                }
                case "index-std-stable": {
                    // Update search index after docs updated
                    stdSearcher.setSearchIndex(newValue);
                    break;
                }
                case "index-std-nightly": {
                    // Update search index after docs updated
                    nightlySearcher.setSearchIndex(newValue);
                    break;
                }
                case "index-book": {
                    bookSearcher = new BookSearch(newValue);
                    break;
                }
                case "index-caniuse": {
                    caniuseSearcher = new CaniuseSearch(newValue);
                    break;
                }
                case "index-command": {
                    let index = newValue;
                    bookCommand.setIndex(index['book']);
                    bookZhCommand.setIndex(index['book/zh']);
                    cargoCommand.setIndex(index['cargo'])
                    yetCommand.setIndex(index['yet']);
                    toolCommand.setIndex(index['tool']);
                    mirrorCommand.setIndex(index['mirror']);
                    break;
                }
                case "index-crate": {
                    crateSearcher.setCrateIndex(newValue);
                    break;
                }
                case "index-crate-mapping": {
                    crateSearcher.setMapping(newValue);
                    break;
                }
                case "index-label": {
                    labelCommand = new LabelCommand(newValue);
                    break;
                }
                case "index-lint": {
                    lintSearcher = new LintSearch(newValue);
                    break;
                }
                case "index-rfc": {
                    rfcCommand = new RfcCommand(newValue);
                    break;
                }
                case "index-rustc": {
                    rustcCommand = new RustcCommand(newValue);
                    break;
                }
                case "index-target": {
                    targetCommand = new TargetCommand(newValue);
                    break;
                }
                default: {
                    // crate update from docs.rs.
                    if (key.startsWith('@')) {
                        if (!oldValue && newValue) {
                            console.log(`Crate ${key} has been added.`);
                        } else if (oldValue && !newValue) {
                            console.log(`Crate ${key} has been deleted.`);
                        }
                        crateDocSearcher.invalidateCachedSearch();
                        crateDocSearcher.initAllCrateSearcher();
                    }
                    break;
                }
            }
        }
    });

    await checkAutoUpdate();
}

async function checkAutoUpdate() {
    if (await settings.autoUpdate) {
        let version = await storage.getItem('auto-update-version');
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        if (version && today <= Date.parse(version)) {
            // Check version between localStorage and today to ensure open update page once a day.
            return;
        }

        Omnibox.navigateToUrl(INDEX_UPDATE_URL);
        await storage.setItem('auto-update-version', `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    }
}

const chromeAction = chrome.action || chrome.browserAction;
chromeAction.onClicked.addListener(() => {
    let managePage = chrome.runtime.getURL("manage/index.html");
    chrome.tabs.create({ url: managePage });
});

chrome.runtime.onInstalled.addListener(async ({ previousVersion, reason }) => {
    const manifest = chrome.runtime.getManifest();
    if (reason === "update" && previousVersion !== manifest.version) {
        IndexManager.updateAllIndex();
        console.log(`New version updated! Previous version: ${previousVersion}, new version: ${manifest.version}`);
    }
});


export { start };
