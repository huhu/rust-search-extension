import settings from "./settings.js";
import attributesIndex from "./index/attributes.js";
import searchState from "./search/docs/desc-shard.js";
import IndexManager from "./index-manager.js";
import CrateSearch from "./search/crate.js";
import CaniuseSearch from "./search/caniuse.js";
import BookSearch from "./search/book.js";
import LintSearch from "./search/lint.js";
import AttributeSearch from "./search/attribute.js";
import DocSearch from "./search/docs/base.js";
import CrateDocSearch from "./search/docs/crate-doc.js";
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
import {
    INDEX_UPDATE_URL,
    RUST_RELEASE_README_URL,
} from "./constants.js";
import DescShardManager from "./search/docs/desc-shard.js";
import { RustSearchOmnibox, getBaseUrl } from "./lib.js";


async function start(omnibox) {
    // All dynamic setting items. Those items will been updated
    // in chrome.storage.onchange listener callback.
    let isOfflineMode = await settings.isOfflineMode;
    let offlineDocPath = await settings.offlineDocPath;

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

    const nightlyDescShards = await DescShardManager.create("std-nightly");
    const stdDescShards = await DescShardManager.create("std-stable");
    let nightlySearcher = new DocSearch(
        "std",
        await IndexManager.getStdNightlyIndex(),
        "https://doc.rust-lang.org/nightly/",
        nightlyDescShards,
    );
    let stdSearcher = new DocSearch(
        "std",
        await IndexManager.getStdStableIndex(),
        await getBaseUrl(),
        stdDescShards,
    );

    RustSearchOmnibox.run({
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
    });

    if (!omnibox.extensionMode) return;

    chrome.storage.onChanged.addListener(async changes => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log('storage key updated:', key);
            switch (key) {
                case "offline-mode": {
                    isOfflineMode = newValue;
                    stdSearcher.setRootPath(await getBaseUrl());
                    break;
                }
                case "offline-path": {
                    offlineDocPath = newValue;
                    stdSearcher.setRootPath(await getBaseUrl());
                    break;
                }
                case "index-std-stable": {
                    // Update search index after docs updated
                    stdSearcher.setSearchIndex(new Map(newValue));
                    break;
                }
                case "index-std-nightly": {
                    // Update search index after docs updated
                    nightlySearcher.setSearchIndex(new Map(newValue));
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
                    } else if (key === "desc-shards-std-stable") {
                        stdDescShards.addCrateDescShards("std-stable");
                    } else if (key === "desc-shards-std-nightly") {
                        nightlyDescShards.addCrateDescShards("std-nightly");
                    } else if (key.startsWith("desc-shards-")) {
                        let crateName = key.slice(12);
                    }
                    break;
                }
            }
        }
    });
}

export { start };
