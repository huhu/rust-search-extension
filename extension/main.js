const c = new Compat();
const manifestVersion = chrome.runtime.getManifest().manifest_version;

// Get the information about the current platform os.
// Possible os values: "mac", "win", "android", "cros", "linux", or "openbsd"
function getPlatformOs() {
    return new Promise(resolve => {
        chrome.runtime.getPlatformInfo(platformInfo => {
            resolve(platformInfo.os);
        });
    });
}

(async () => {
    if (manifestVersion === 2) {
        await migrate();
    }

    // All dynamic setting items. Those items will been updated
    // in chrome.storage.onchange listener callback.
    let isOfflineMode = await settings.isOfflineMode;
    let offlineDocPath = await settings.offlineDocPath;
    let defaultSearch = await settings.defaultSearch;
    let crateRegistry = await settings.crateRegistry;

    const os = await getPlatformOs();
    const RUST_RELEASE_README_URL = "https://github.com/rust-lang/rust/blob/master/RELEASES.md";
    const INDEX_UPDATE_URL = "https://rust.extension.sh/update";

    let crateSearcher = new CrateSearch(await IndexManager.getCrateMapping(), await IndexManager.getCrateIndex());
    let caniuseSearcher = new CaniuseSearch(await IndexManager.getCaniuseIndex());
    let bookSearcher = new BookSearch(await IndexManager.getBookIndex());
    let lintSearcher = new LintSearch(await IndexManager.getLintIndex());

    const attributeSearcher = new AttributeSearch(attributesIndex);
    const crateDocSearcher = new CrateDocSearch();

    const commandIndex = await IndexManager.getCommandIndex();
    const cargoCommand = new SimpleCommand('cargo', 'Show all useful third-party cargo subcommands.', commandIndex['cargo']);
    const bookCommand = new SimpleCommand('book', 'Show all Rust books.', commandIndex['book']);
    const bookZhCommand = new SimpleCommand('book/zh', 'Show all Chinese Rust books.', commandIndex['book/zh']);
    const yetCommand = new SimpleCommand('yet', 'Show all Are We Yet websites.', commandIndex['yet']);
    const toolCommand = new SimpleCommand('tool', 'Show some most useful Rust tools.', commandIndex['tool']);
    const mirrorCommand = new SimpleCommand('mirror', 'Show all Rust mirror websites.', commandIndex['mirror']);
    const labelCommand = new LabelCommand(await IndexManager.getLabelIndex());
    const rfcCommand = new RfcCommand(await IndexManager.getRfcIndex());
    const blogCommand = new BlogCommand();

    const commandManager = new CommandManager(
        cargoCommand,
        bookCommand,
        bookZhCommand,
        yetCommand,
        toolCommand,
        mirrorCommand,
        labelCommand,
        rfcCommand,
        blogCommand,
        new HelpCommand(),
        new StableCommand(),
        new HistoryCommand(),
        new OpenCommand('stats', 'Open search statistics page.',
            chrome.runtime.getURL("manage/index.html"), {
                content: ':stats',
                description: `Press ${c.match("Enter")} to open search statistics page.`,
            }),
        new OpenCommand('update', 'Update to the latest search index.',
            INDEX_UPDATE_URL, {
                content: ':update',
                description: `Press ${c.match("Enter")} to open search-index update page.`,
            }),
        new OpenCommand('release', 'Open rust-lang repository release page.',
            RUST_RELEASE_README_URL, {
                content: ':release',
                description: `Press ${c.match("Enter")} to open rust-lang repository release page.`,
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

    const defaultSuggestion = `Search std ${c.match("docs")}, external ${c.match("docs")} (~,@), ${c.match("crates")} (!), ${c.match("attributes")} (#), ${c.match("books")} (%), clippy ${c.match("lints")} (>), and ${c.match("error codes")}, etc in your address bar instantly!`;
    const omnibox = new Omnibox(defaultSuggestion, c.omniboxPageSize());

    let formatDoc = (index, doc) => {
        let content = doc.href;
        if (isOfflineMode && os === "win") {
            // Replace all "/" to "\" for Windows in offline mode.
            content.replaceAll("/", "\\");
        }

        let description = doc.displayPath + c.match(doc.name);
        if (doc.desc) {
            description += ` - ${c.dim(c.escape(c.eliminateTags(doc.desc)))}`;
        }

        if (doc.queryType === "s" || doc.queryType === "src") {
            let url = new URL(doc.href);
            url.search = "?mode=src";
            content = url.toString();
            description = `[Source code] ${description}`;
        }
        return {content, description};
    };

    omnibox.bootstrap({
        onSearch: (query) => {
            return stdSearcher.search(query);
        },
        onFormat: formatDoc,
        onAppend: (query) => {
            return [{
                content: stdSearcher.getSearchUrl(query),
                description: `Search Rust docs ${c.match(query)} on ${isOfflineMode ? "offline mode" : stdSearcher.getRootPath()}`,
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
                let [_, __, crateName] = new URL(content).pathname.slice(1).split("/");
                let crateVersion = (await CrateDocManager.getCrates())[crateName].version;
                return content.replace("/~/", `/${crateName}/`).replace("/*/", `/${crateVersion}/`);
            } else {
                return content;
            }
        },
        afterNavigated: async (query, result) => {
            // Ignore the command history
            if (query && query.startsWith(":")) return;

            // Only keep the latest 100 of search history.
            let historyItem = await HistoryCommand.record(query, result, maxSize = 100);
            let statistics = await Statistics.load();
            await statistics.record(historyItem, true);
        }
    });

    // Nightly std docs search
    omnibox.addPrefixQueryEvent("/", {
        onSearch: (query) => {
            query = query.replaceAll("/", "").trim();
            return nightlySearcher.search(query);
        },
        onFormat: (index, doc) => {
            let {content, description} = formatDoc(index, doc);
            return {content, description: '[Nightly] ' + description};
        },
        onAppend: (query) => {
            query = query.replaceAll("/", "").trim();
            return [{
                content: nightlySearcher.getSearchUrl(query),
                description: `Search nightly Rust docs ${c.match(query)} on ${nightlySearcher.getRootPath()}`,
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
            let {content, description} = formatDoc(index, doc);
            return {content, description: '[Rustc] ' + description};
        },
        onAppend: (query) => {
            query = query.replaceAll("/", "").trim();
            if (rustcSearcher.searchIndex && rustcSearcher.searchIndex.length > 0) {
                return [{
                    content: rustcSearcher.getSearchUrl(query),
                    description: `Search nightly rustc docs ${c.match(query)} on ${rustcSearcher.getRootPath()}`,
                }];
            } else {
                return [{
                    content: rustcSearcher.getRootPath(),
                    description: "To search nightly rustc docs, please open the nightly rustc docs page in advance.",
                }]
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
                    description: `${c.match(content)} v${item.version} - ${c.dim(c.escape(c.eliminateTags(item.doc)))}`,
                }
            }
        },
        onAppend: () => {
            return [{
                content: chrome.runtime.getURL("manage/crates.html"),
                description: `Remind: ${c.dim("Select here to manage all your indexed crates")}`,
            }];
        }
    });

    function wrapCrateSearchAppendix(appendix) {
        return [
            appendix,
            {
                content: "remind",
                description: `Remind: ${c.dim("We only indexed the top 20K crates. Sorry for the inconvenience if your desired crate not show.")}`,
            }
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
                description: `${c.capitalize("docs.rs")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(c.eliminateTags(crate.description)))}`,
            }
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            return wrapCrateSearchAppendix({
                content: "https://docs.rs/releases/search?query=" + encodeURIComponent(keyword),
                description: "Search Rust crates for " + c.match(keyword) + " on https://docs.rs",
            });
        }
    });

    omnibox.addPrefixQueryEvent("!!", {
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `https://${crateRegistry}/crates/${crate.id}`,
                description: `${c.capitalize(crateRegistry)}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(c.eliminateTags(crate.description)))}`,
            };
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            return wrapCrateSearchAppendix({
                content: `https://${crateRegistry}/search?q=` + encodeURIComponent(keyword),
                description: "Search Rust crates for " + c.match(keyword) + ` on https://${crateRegistry}`,
            });
        }
    });

    const REDIRECT_URL = chrome.runtime.getURL("manage/redirect.html");
    omnibox.addPrefixQueryEvent("!!!", {
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `${REDIRECT_URL}?crate=${crate.id}`,
                description: `${c.capitalize("repository")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(c.eliminateTags(crate.description)))}`,
            };
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            return wrapCrateSearchAppendix({
                content: "https://github.com/search?q=" + encodeURIComponent(keyword),
                description: "Search Rust crates for " + c.match(keyword) + " on https://github.com",
            });
        }
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
                description: `Attribute: ${c.match("#[" + attribute.name + "]")} ${c.dim(c.escape(attribute.description))}`,
            }
        }
    });

    omnibox.addPrefixQueryEvent("?", {
        onSearch: (query) => {
            return caniuseSearcher.search(query);
        },
        onFormat: (index, feat, query) => {
            let content;
            let description;
            if (query.startsWith("??")) {
                content = `https://github.com/rust-lang/rfcs/pull/${feat.rfc}`;
                description = `RFC: ${c.match(c.escape(feat.match))} [${feat.version}] - ${c.dim(c.escape(feat.description))}`
            } else {
                content = `https://caniuse.rs/features/${feat.slug}`;
                description = `Can I use: ${c.match(c.escape(feat.match))} [${feat.version}] - ${c.dim(c.escape(feat.description))}`
            }
            return {
                content,
                description
            };
        },
    });

    // Search previous Rust version
    omnibox.addRegexQueryEvent(/^1\.\d*/i, {
        onSearch: (query) => {
            let [_, minor] = query.split('.');
            return getReleasedVersions()
                .filter(v => !minor || `${v.minor}`.startsWith(minor))
                .map(version => {
                    return {
                        content: `${RUST_RELEASE_README_URL}?version=${version.number}`,
                        description: `Rust ${c.match(version.number)} - ${c.dim(c.normalizeDate(version.date))}`,
                    }
                });
        }
    });

    omnibox.addRegexQueryEvent(/^`?e\d{2,4}`?$/i, {
        onSearch: (query) => {
            query = query.replace("`", "");
            let baseIndex = parseInt(query.slice(1).padEnd(4, '0')) + 1;
            let result = [];
            for (let i = 0; i < 10; i++) {
                let errorIndex = 'E' + String(baseIndex++).padStart(4, "0").toUpperCase();
                result.push(errorIndex);
            }
            let baseUrl = isOfflineMode ? offlineDocPath : 'https://doc.rust-lang.org/';
            return result.map(errorCode => {
                return {
                    content: `${baseUrl}error-index.html#${errorCode}`,
                    description: `Search Rust error index for ${c.match(errorCode)} on ${isOfflineMode ? 'offline mode' : 'https://doc.rust-lang.org/error-index.html'}`,
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
                description: `${[...parentTitles.map(t => c.escape(t)), c.match(c.escape(page.title))].join(" > ")} - ${c.dim(page.name)}`
            }
        }
    });

    const LINT_URL = "https://rust-lang.github.io/rust-clippy/master/";
    omnibox.addPrefixQueryEvent(">", {
        onSearch: (query) => {
            return lintSearcher.search(query);
        },
        onFormat: (index, lint) => {
            return {
                content: `${LINT_URL}#${lint.name}`,
                description: `Clippy lint: [${lint.level}] ${c.match(lint.name)} - ${c.dim(c.escape(lint.description))}`,
            }
        },
    });

    omnibox.addPrefixQueryEvent(":", {
        onSearch: async (query) => {
            return commandManager.execute(query);
        },
    });

    omnibox.addNoCacheQueries("/", "!", "@", ":");

    chrome.storage.onChanged.addListener(changes => {
        if (changes['offline-mode']) {
            isOfflineMode = changes['offline-mode'].newValue;
        }
        if (changes['offline-path']) {
            offlineDocPath = changes['offline-path'].newValue;
        }
        if (changes['default-search']) {
            defaultSearch = changes['default-search'].newValue;
        }
        if (changes['crate-registry']) {
            crateRegistry = changes['crate-registry'].newValue;
        }
    });

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

    // DO NOT USE ASYNC CALLBACK HERE, SEE THIS ISSUE:
    // https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-918076049
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            // Stable:* action is exclusive to stable docs event
            case "stable:add": {
                if (message.searchIndex) {
                    IndexManager.setStdStableIndex(message.searchIndex);
                    // Update search index after docs updated
                    stdSearcher.setSearchIndex(message.searchIndex);
                    sendResponse(true);
                } else {
                    sendResponse(false);
                }
                break;
            }
            // Nightly:* action is exclusive to nightly docs event
            case "nightly:add": {
                if (message.searchIndex) {
                    IndexManager.setStdNightlyIndex(message.searchIndex);
                    // Update search index after docs updated
                    nightlySearcher.setSearchIndex(message.searchIndex);
                    sendResponse(true);
                } else {
                    sendResponse(false);
                }
                break;
            }
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
            // Crate:* action is exclusive to crate event
            case "crate:add": {
                if (message.searchIndex) {
                    CrateDocManager.addCrate(message.crateName, message.crateVersion, message.searchIndex)
                        .then(() => {
                            crateDocSearcher.invalidateCachedSearch();
                            crateDocSearcher.initAllCrateSearcher();
                        })
                        .then(() => {
                            sendResponse(true);
                        });
                } else {
                    sendResponse(false);
                }
                break;
            }
            case "crate:remove": {
                CrateDocManager.removeCrate(message.crateName)
                    .then(() => {
                        crateDocSearcher.invalidateCachedSearch();
                        crateDocSearcher.initAllCrateSearcher();
                    })
                    .then(() => {
                        sendResponse(true);
                    });
                break;
            }
            // Index-update:* action is exclusive to index update event
            case "index-update:crate": {
                IndexManager.setCrateMapping(message.mapping);
                IndexManager.setCrateIndex(message.index);
                crateSearcher = new CrateSearch(message.mapping, message.index);
                sendResponse(true);
                break;
            }
            case "index-update:book": {
                IndexManager.setBookIndex(message.index);
                bookSearcher = new BookSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:lint": {
                IndexManager.setLintIndex(message.index);
                lintSearcher = new LintSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:label": {
                IndexManager.setLabelIndex(message.index);
                labelCommand.setIndex(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:rfc": {
                IndexManager.setRfcIndex(message.index);
                rfcCommand.setIndex(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:caniuse": {
                IndexManager.setCaniuseIndex(message.index);
                caniuseSearcher = new CaniuseSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:command": {
                let index = message.index;
                IndexManager.setCommandIndex(index);
                bookCommand.setIndex(index['book']);
                bookZhCommand.setIndex(index['book/zh']);
                cargoCommand.setIndex(index['cargo'])
                yetCommand.setIndex(index['yet']);
                toolCommand.setIndex(index['tool']);
                mirrorCommand.setIndex(index['mirror']);
                blogCommand.setPosts(index['blog']);
                sendResponse(true);
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

    // Put blog release request last to avoid error due to
    // possibly request failed. E.g. Github Pages down.
    let response = await fetch("https://blog.rust-lang.org/releases.json");
    blogCommand.setPosts((await response.json())["releases"]);
})();

(async () => {
    let history = await storage.getItem("history") || [];
    if (history) {
        if (!await storage.getItem("statistics")) {
            let statistics = await Statistics.load();
            for (const item of history) {
                await statistics.record(item);
            }

            await statistics.save();
        }

        // Eliminate unnecessary tags (such as <match>, <dim>) to save disk usage.
        history = history
            .map(({description, ...rest}) => {
                return {
                    description: description
                        .replace(/<\/?match>/g, "")
                        .replace(/<\/?dim>/g, ""),
                    ...rest,
                };
            });
        await storage.setItem("history", history);
    }
})();

const chromeAction = chrome.action || chrome.browserAction;
chromeAction.onClicked.addListener(() => {
    let managePage = chrome.runtime.getURL("manage/index.html");
    chrome.tabs.create({url: managePage});
});