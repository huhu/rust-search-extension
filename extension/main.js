const c = new Compat();
(async () => {
    let crateSearcher = new CrateSearch(await IndexManager.getCrateMapping(), await IndexManager.getCrateIndex());
    let caniuseSearcher = new CaniuseSearch(await IndexManager.getCaniuseIndex());
    let bookSearcher = new BookSearch(await IndexManager.getBookIndex());
    let lintSearcher = new LintSearch(await IndexManager.getLintIndex());

    const attributeSearcher = new AttributeSearch(attributesIndex);
    const crateDocSearchManager = new CrateDocSearchManager();

    const commandIndex = await IndexManager.getCommandIndex();
    const bookCommand = new SimpleCommand('book', 'Show all Rust official books.', commandIndex['book']);
    const yetCommand = new SimpleCommand('yet', 'Show all Are We Yet websites.', commandIndex['yet']);
    const toolCommand = new SimpleCommand('tool', 'Show some most useful Rust tools.', commandIndex['tool']);
    const mirrorCommand = new SimpleCommand('mirror', 'Show all Rust mirror websites.', commandIndex['mirror']);
    const labelCommand = new LabelCommand(await IndexManager.getLabelIndex());
    const commandManager = new CommandManager(
        new HelpCommand(),
        bookCommand,
        yetCommand,
        toolCommand,
        mirrorCommand,
        labelCommand,
        new StableCommand(),
        new UpdateCommand(),
        new StatsCommand(),
        new HistoryCommand(),
    );

    let stdSearcher = new StdSearch(await IndexManager.getStdStableIndex());
    let nightlySearcher = new NightlySearch(await IndexManager.getStdNightlyIndex());

    const defaultSuggestion = `Search std ${c.match("docs")}, external ${c.match("docs")} (~,@), ${c.match("crates")} (!), ${c.match("attributes")} (#), ${c.match("books")} (%), clippy ${c.match("lints")} (>), and ${c.match("error codes")}, etc in your address bar instantly!`;
    const omnibox = new Omnibox(defaultSuggestion, c.omniboxPageSize());

    let formatDoc = (index, doc) => {
        let description = doc.displayPath + c.match(doc.name);
        if (doc.desc) {
            description += ` - ${c.dim(c.escape(doc.desc))}`;

        }
        return {content: doc.href, description};
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

    omnibox.addPrefixQueryEvent("/", {
        onSearch: (query) => {
            query = query.replace("/", "").trim();
            return nightlySearcher.search(query);
        },
        onFormat: (index, doc) => {
            let {content, description} = formatDoc(index, doc);
            return {content, description: '[Nightly] ' + description};
        },
        onAppend: (query) => {
            query = query.replace("/", "");
            if (nightlySearcher.searchIndex && nightlySearcher.searchIndex.length > 0) {
                return [{
                    content: nightlySearcher.getSearchUrl(query),
                    description: `Search nightly Rust docs ${c.match(query)} on ${nightlySearcher.rootPath}`,
                }];
            } else {
                return [{
                    content: "https://doc.rust-lang.org/nightly/std/",
                    description: "To search nightly docs, please press Enter to open the nightly docs page firstly.",
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

    const REDIRECT_URL = chrome.runtime.getURL("redirect.html");
    omnibox.addPrefixQueryEvent("!", {
        defaultSearch: true,
        searchPriority: 1,
        onSearch: (query) => {
            return crateSearcher.search(query);
        },
        onFormat: (index, crate, query) => {
            let content;
            let description;
            if (query.startsWith("!!!")) {
                content = `${REDIRECT_URL}?crate=${crate.id}`;
                description = `${c.capitalize("repository")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`;
            } else if (query.startsWith("!!")) {
                content = `https://docs.rs/${crate.id}`;
                description = `${c.capitalize("docs.rs")}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`
            } else {
                let registry = settings.crateRegistry;
                content = `https://${registry}/crates/${crate.id}`;
                description = `${c.capitalize(registry)}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`
            }
            return {
                content,
                description
            };
        },
        onAppend: (query) => {
            let keyword = query.replace(/[!\s]/g, "");
            let encode = encodeURIComponent(keyword);
            let content;
            let description;
            if (query.startsWith("!!!")) {
                content = "https://github.com/search?q=" + encode;
                description = "Search Rust crates for " + c.match(keyword) + " on https://github.com";
            } else if (query.startsWith("!!")) {
                content = "https://docs.rs/releases/search?query=" + encode;
                description = "Search Rust crates for " + c.match(keyword) + " on https://docs.rs";
            } else {
                let registry = settings.crateRegistry;
                content = `https://${registry}/search?q=` + encode;
                description = "Search Rust crates for " + c.match(keyword) + ` on https://${registry}`;
            }
            return [{
                content,
                description
            }, {
                content: "remind",
                description: `Remind: ${c.dim("We only indexed the top 20K crates. Sorry for the inconvenience if your desired crate not show.")}`,
            }];
        }
    });

    omnibox.addPrefixQueryEvent("#", {
        defaultSearch: true,
        searchPriority: 2,
        onSearch: (query) => {
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
        Omnibox.navigateToUrl("https://rust.extension.sh/update");
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
