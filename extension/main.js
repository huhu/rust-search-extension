const c = new Compat();
(async () => {
    let crateSearcher = new CrateSearch(await IndexManager.getCrateMapping(), await IndexManager.getCrateIndex());
    let caniuseSearcher = new CaniuseSearch(await IndexManager.getCaniuseIndex());
    let bookSearcher = new BookSearch(await IndexManager.getBookIndex());
    let lintSearcher = new LintSearch(await IndexManager.getLintIndex());

    const attributeSearcher = new AttributeSearch(attributesIndex);
    const crateDocSearchManager = new CrateDocSearchManager();

    const commandIndex = await IndexManager.getCommandIndex();
    const cargoCommand = new SimpleCommand('cargo', 'Show all useful third-party cargo subcommands.', commandIndex['cargo']);
    const bookCommand = new SimpleCommand('book', 'Show all Rust official books.', commandIndex['book']);
    const yetCommand = new SimpleCommand('yet', 'Show all Are We Yet websites.', commandIndex['yet']);
    const toolCommand = new SimpleCommand('tool', 'Show some most useful Rust tools.', commandIndex['tool']);
    const mirrorCommand = new SimpleCommand('mirror', 'Show all Rust mirror websites.', commandIndex['mirror']);
    const labelCommand = new LabelCommand(await IndexManager.getLabelIndex());
    const statsCommand = new OpenCommand('stats', 'Open search statistics page.',
        chrome.runtime.getURL("stats/index.html"),
        {
            content: ':stats',
            description: `Press ${c.match("Enter")} to open search statistics page.`,
        });
    const updateCommand = new OpenCommand('update', 'Update to the latest search index.',
        'https://rust.extension.sh/update',
        {
            content: ':update',
            description: `Press ${c.match("Enter")} to open search-index update page.`,
        });
    const releaseCommand = new OpenCommand('release', 'Open rust-lang repository release page.',
        'https://github.com/rust-lang/rust/blob/master/RELEASES.md',
        {
            content: ':release',
            description: `Press ${c.match("Enter")} to open rust-lang repository release page.`,
        });

    let response = await fetch("https://blog.rust-lang.org/releases.json");
    const commandManager = new CommandManager(
        cargoCommand,
        bookCommand,
        yetCommand,
        toolCommand,
        mirrorCommand,
        labelCommand,
        statsCommand,
        updateCommand,
        releaseCommand,
        new HelpCommand(),
        new BlogCommand((await response.json())["releases"]),
        new StableCommand(),
        new HistoryCommand(),
    );

    let stdSearcher = new StdSearch(await IndexManager.getStdStableIndex());
    let nightlySearcher = new NightlySearch(await IndexManager.getStdNightlyIndex());
    let rustcSearcher = new RustcSearch();

    const defaultSuggestion = `Search std ${c.match("docs")}, external ${c.match("docs")} (~,@), ${c.match("crates")} (!), ${c.match("attributes")} (#), ${c.match("books")} (%), clippy ${c.match("lints")} (>), and ${c.match("error codes")}, etc in your address bar instantly!`;
    const omnibox = new Omnibox(defaultSuggestion, c.omniboxPageSize());

    let formatDoc = (index, doc) => {
        let content = doc.href;
        let description = doc.displayPath + c.match(doc.name);
        if (doc.desc) {
            description += ` - ${c.dim(c.escape(doc.desc))}`;
        }

        if (doc.queryType === "src") {
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
                description: `Search Rust docs ${c.match(query)} on ${settings.isOfflineMode ? "offline mode" : stdSearcher.rootPath}`,
            }];
        },
        onEmptyNavigate: (content, disposition) => {
            commandManager.handleCommandEnterEvent(content, disposition);
        },
        beforeNavigate: (query, content) => {
            if (content && /^@\w+$/i.test(content.trim())) {
                // Case: @crate, redirect to that crate's docs.rs page
                return `https://docs.rs/${content.replace("@", "")}`;
            } else if (content && /^https?.*\/~\/\*\/.*/ig.test(content)) {
                // Sanitize docs url which from all crates doc search mode. (Prefix with "~")
                // Here is the url instance: https://docs.rs/~/*/reqwest/fn.get.html
                let [_, __, crateName] = new URL(content).pathname.slice(1).split("/");
                let crateVersion = CrateDocSearchManager.getCrates()[crateName].version;
                return content.replace("/~/", `/${crateName}/`).replace("/*/", `/${crateVersion}/`);
            } else {
                return content;
            }
        },
        afterNavigated: (query, result) => {
            HistoryCommand.record(query, result);
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
                description: `Search nightly Rust docs ${c.match(query)} on ${nightlySearcher.rootPath}`,
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
                    description: `Search nightly rustc docs ${c.match(query)} on ${rustcSearcher.rootPath}`,
                }];
            } else {
                return [{
                    content: rustcSearcher.rootPath,
                    description: "To search nightly rustc docs, please open the nightly rustc docs page firstly.",
                }]
            }
        },
    });

    omnibox.addPrefixQueryEvent("~", {
        onSearch: (query) => {
            return crateDocSearchManager.searchAll(query);
        },
        onFormat: formatDoc,
    });

    omnibox.addPrefixQueryEvent("@", {
        onSearch: (query) => {
            return crateDocSearchManager.search(query);
        },
        onFormat: (index, item) => {
            if (item.hasOwnProperty("content")) {
                // 1. Crate list header.
                // 2. Crate result footer
                return item;
            } else if (item.hasOwnProperty("href")) {
                return formatDoc(index, item);
            } else {
                // Crate name list.
                let content = `@${item.name}`;
                return {
                    content,
                    description: `${c.match(content)} v${item.version} - ${c.dim(item.doc)}`,
                }
            }
        },
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
        defaultSearch: true,
        searchPriority: 1,
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `https://docs.rs/${crate.id}`,
                description: `${c.capitalize("docs.rs")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`,
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
            let registry = settings.crateRegistry;
            return {
                content: `https://${registry}/crates/${crate.id}`,
                description: `${c.capitalize(registry)}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`,
            };
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            let registry = settings.crateRegistry;
            return wrapCrateSearchAppendix({
                content: `https://${registry}/search?q=` + encodeURIComponent(keyword),
                description: "Search Rust crates for " + c.match(keyword) + ` on https://${registry}`,
            });
        }
    });

    const REDIRECT_URL = chrome.runtime.getURL("redirect.html");
    omnibox.addPrefixQueryEvent("!!!", {
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate) => {
            return {
                content: `${REDIRECT_URL}?crate=${crate.id}`,
                description: `${c.capitalize("repository")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`,
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
        defaultSearch: true,
        searchPriority: 2,
        onSearch: (query) => {
            query = query.replace(/[\[\]]/g, "");
            return attributeSearcher.search(query);
        },
        onFormat: (index, attribute) => {
            return {
                content: attribute.href,
                description: `Attribute: ${c.match("#[" + attribute.name + "]")} ${c.dim(attribute.description)}`,
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

    const RUST_RELEASE_README_URL = "https://github.com/rust-lang/rust/blob/master/RELEASES.md";
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

    omnibox.addRegexQueryEvent(/`?e\d{2,4}`?$/i, {
        onSearch: (query) => {
            query = query.replace("`", "");
            let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));
            let result = [];
            for (let index = 0; index < 10; index++) {
                let errorIndex = 'E' + String(baseIndex++).padStart(4, "0").toUpperCase();
                result.push(errorIndex);
            }
            return result.map(errorCode => {
                return {
                    content: "https://doc.rust-lang.org/error-index.html#" + errorCode,
                    description: `Search Rust error index for ${c.match(errorCode)} on https://doc.rust-lang.org/error-index.html`,
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
        onSearch: (query) => {
            return commandManager.execute(query);
        },
    });

    omnibox.addNoCacheQueries("/", "!", "@", ":");

    if (settings.autoUpdate) {
        let version = localStorage.getItem('auto-update-version');
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        if (version && today <= Date.parse(version)) {
            // Check version between localStorage and today to ensure open update page once a day.
            return;
        }

        Omnibox.navigateToUrl("https://rust.extension.sh/update");
        localStorage.setItem('auto-update-version', `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    }

    let fileNewIssue = "title=Have you found a bug? Did you feel something was missing?&body=Whatever it was, we'd love to hear from you.";
    chrome.runtime.setUninstallURL(
        `https://github.com/huhu/rust-search-extension/issues/new?${encodeURI(fileNewIssue)}`
    );

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            // Stable:* action is exclusive to stable docs event
            case "stable:add" : {
                IndexManager.setStdStableIndex(message.searchIndex);
                // New stdSearcher instance after docs updated
                stdSearcher = new StdSearch(message.searchIndex);
                sendResponse(true);
                break;
            }
            // Nightly:* action is exclusive to nightly docs event
            case "nightly:add" : {
                IndexManager.setStdNightlyIndex(message.searchIndex);
                // New nightlySearcher instance after docs updated
                nightlySearcher = new NightlySearch(message.searchIndex);
                sendResponse(true);
                break;
            }
            // Rustc:* action is exclusive to rustc docs event
            case "rustc:check" : {
                sendResponse({
                    version: rustcSearcher.version,
                });
                break;
            }
            case "rustc:add" : {
                // New rustcSearcher instance after docs updated
                rustcSearcher = new RustcSearch(message.searchIndex, message.version);
                sendResponse(true);
                break;
            }
            // Crate:* action is exclusive to crate event
            case "crate:check": {
                let crates = CrateDocSearchManager.getCrates();
                sendResponse(crates[message.crateName]);
                break;
            }
            case "crate:add": {
                CrateDocSearchManager.addCrate(message.crateName, message.crateVersion, message.searchIndex);
                crateDocSearchManager.initAllCrateSearcher();
                sendResponse(true);
                break;
            }
            case "crate:remove": {
                CrateDocSearchManager.removeCrate(message.crateName);
                crateDocSearchManager.initAllCrateSearcher();
                sendResponse(true);
                break;
            }
            // Index-update:* action is exclusive to index update event
            case "index-update:crate" : {
                IndexManager.setCrateMapping(message.mapping);
                IndexManager.setCrateIndex(message.index);
                crateSearcher = new CrateSearch(message.mapping, message.index);
                sendResponse(true);
                break;
            }
            case "index-update:book" : {
                IndexManager.setBookIndex(message.index);
                bookSearcher = new BookSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:lint" : {
                IndexManager.setLintIndex(message.index);
                lintSearcher = new LintSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:label" : {
                IndexManager.setLabelIndex(message.index);
                labelCommand.setIndex(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:caniuse" : {
                IndexManager.setCaniuseIndex(message.index);
                caniuseSearcher = new CaniuseSearch(message.index);
                sendResponse(true);
                break;
            }
            case "index-update:command" : {
                let index = message.index;
                IndexManager.setCommandIndex(index);
                bookCommand.setIndex(index['book']);
                yetCommand.setIndex(index['yet']);
                toolCommand.setIndex(index['tool']);
                mirrorCommand.setIndex(index['mirror']);
                sendResponse(true);
                break;
            }
        }
        return true;
    });
})();
