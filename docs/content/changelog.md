+++
title = "Changelog"
description = "Changelog"
weight = 3
+++

# v1.3 - 2021-08-01

- Unify **Settings**, **Statistics** into **manage pages**, additionally, you can also:
  - Manage your all indexed crates.
  - **Import/Export** your settings, search history, statistics, and crates data.
- Support offline mode in Windows.
- Show **Table of Content** in [docs.rs](https://docs.rs).
- Improvements:
  - Only keep the latest 100 search histories.
  - Ignore legacy rust std docs, such as [v0.12.0](https://doc.rust-lang.org/0.12.0/std/index.html).
- Bugfix:
  - Fix fail to add some crate into the extension issue. Fix {{ issue(id=114) }}, {{ issue(id=119) }}, {{ issue(id=120) }}.

## v1.3.1 - 2021-08-06

- Fix docs.rs **Table of Content** render issues. {{ issue(id=122) }}, {{ issue(id=123) }}
- Fix manage crates page UI issue.

## v1.3.2 - 2021-08-07

- Fix the stupid bug: missing the manage pages. {{ issue(id=124) }}

# v1.2 - 2021-03-26

- Support prefix `//` (double slash) to search [rustc crates docs](https://doc.rust-lang.org/nightly/nightly-rustc/). 👉 [Learn more](/#search-rustc-docs).
- Support search released Rust versions quickly. 👉 [Learn more](/#search-rust-version).
- Add source code mode (with `src:` or with alias `s:`) to open the source code page directly. 👉 [Learn more](/#source-code-mode).
- New commands:
  - `:blog`: show all Rust release blog posts.
- Improvements:
  - Add a reminder for Firefox offline mode on the popup page. Fix {{ issue(id=94) }}.
  - Add fallback search strategy for @crate search. Fix {{ issue(id=96) }}.
  - Only open update page once a day if the auto-update is on. Fix {{ issue(id=97) }}.
  - Add more useful tips for the `:help` command.
  - Compress history's JSON data slightly.
- Bugfix:
  - Fix the compatibility for the new style of search-index.js format. Fix {{ issue(id=106) }}.
  - Fix the compatibility of search-index.js on-demand load mode. See this commit [eefa192c](https://github.com/huhu/rust-search-extension/commit/eefa192c90450ac6340c3eedf2ad6c9cf1dc7f13).
  - Add validation when auto index std search-index. Fix {{ issue(id=99) }}.
  - Fix compatibility issue of the new const-since link in Rust docs page.
  - Fix search statistics bug for [https://docs.rs/releases](https://docs.rs/releases) data.

## v1.2.1 - 2021-04-30

- Fix wrongly load searchIndexJS bug. {{ issue(id=114) }}.
- Improve error user experience when adding search index to the extension.
- Fix the compatibility of Github markdown file's sticky header.

# v1.1 - 2021-01-06

- Docs.rs is now the `!` search, crates.io is `!!`. See issue {{ issue(id=85) }}.
- Refactor search statistics page (finer granularity for search metrics)
- Add a table of content for the rust-lang repository release page. (New permission required, see [FAQ](/faq/#why-the-extension-requires-access-to-github-com))
- docs.rust-lang.org enhancement: in stable/nightly docs page and source code pages, link all `"since"` and `"issue"` tags to corresponding URLs
- Show a crate's Cargo.toml quick link when feature flag is empty  
- New commands:
  - `:cargo`: show all useful cargo subcommands
  - `:release`: open rust-lang repository release page
- Bugfix:
  - Fix dark theme color compatibility in docs.rs
  - Fix {{ issue(id=89) }}, official feature flags menu compatibility
  - Fix {{ issue(id=84) }}, feature flags not working in some crate's docs.rs page

# v1.0 - 2020-10-30

Finally, we reach **v1.0**! 🎉🎉

- Support sync stable/nightly std search index automatically. There is no extension updating required to get the latest search index after v1.0.
- Support prefix **?** and **??** to search [caniuse.rs](https://caniuse.rs) and RFC respectively. Thanks the PR {{ issue(id=77) }} from [@aquarhead](https://github.com/aquarhead).
- Upload the latest index files to the [update page](/update) once a day, those index including:
    - Command index 
    - Book index 
    - Clippy lint index 
    - Caniuse index 
    - Github *rust-lang/rust* repository label index 
    - Top 20K crate index 
- Support configure auto index-updating in the popup page
- New commands:
    - `:stats`: open search statistics page
    - `:update`: open the [update page](/update) to sync the latest index automatically
- Bugfix:
    - Fix docs.rs SVG icon missing issue
    - Fix docs.rs new header bar UI compatibility

# v0.11 - 2020-08-27

- New domain: change rust-search-extension.now.sh to [rust.extension.sh](https://rust.extension.sh) 🎉🎉
- Bump std search index version to **v1.46.0**
- Support prefix **/** to search nightly docs
- New commands:
    - `:mirror`: show all rust mirror websites
- Improve error code regex
- Update the latest attribute index

# v0.10 - 2020-06-04

- Bump std search index version to **v1.44.0**
- Support prefix **~** to search all added crate's docs collectively
- Support prefix **!!!** (triple !) to open crate's repository effortlessly
- Support customize [crates.io](https://crates.io)(default) or [lib.rs](https://lib.rs) for crates searching
- Add search statistics page, including calendar heatmap, daily|weekly|hourly search bar charts, and top searched crates, etc
- Improve searching speed, approximately 10% faster than the previous version
- New commands:
    - `:tool`: search rust tools
- Bugfix:
    - Fix std doc offline mode bug
    - Fix wrong Add button state in docs.rs's src page issue 

# v0.9 - 2020-04-24

- Bump std search index version to **v1.43.0**
- Support add crates to Rust Search Extension in docs.rs page，then you can use **@crate-name** to search that crate's docs. 
- Support prefix **>** to search [Cargo Clippy lints](https://rust-lang.github.io/rust-clippy/master/)
- New commands:
    - `:label`: search rust-lang issue label
- Dark mode supported
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe) version is available


# v0.8 - 2020-03-02

- Bump crates index number from top 10K to top 20K
- Support display crate's **Feature flags** in [docs.rs](https://docs.rs) page
- Support prefix **!!** (double exclamation mark) to search crates with [docs.rs](https://docs.rs) url
- Support prefix **%** (percent mark) to search Rust official book chapters
- Builtin command system
    - `:help` command to show all help messages
    - `:book` command to show all Rust official books
    - `:stable` command to show stable Rust scheduled release date in the next year
    - `:yet` command to show all **Are We Yet** websites
    - `:history` command to show your local search history
- Support page down the result with page-turner **-** (hyphen)
- Support open in new tab by using `Cmd`/`Alt` + `Enter`
- Add [Privacy Policy](/privacy/)

## v0.8.1 - 2020-03-12

- Bump std search index to **v1.42.0**
- Fix crate search name unnecessary replacement issue
- Fix `:stable` command version calculation bug
- Fix sync latest crates index bug

# v0.7 - 2020-02-04

- Bump search-index to version **v1.41.0**
- Support search rust builtin attributes instantly
- Announcing on [Reddit post](https://www.reddit.com/r/rust/comments/eymfxu/announcing_rustsearchextension_v07_search_std/), get 200+ upvotes!
- Be included in [This Week in Rust 324](https://this-week-in-rust.org/blog/2020/02/04/this-week-in-rust-324/)

# v0.6 - 2020-01-20

- Bump search-index to version **v1.40.0**
- Support search top 10K crates instantly
- Support update the latest crates index on popup page automatically. (Chrome only)

# v0.5 - 2019-11-08

The version **v0.5** was released at `2019-11-08`.

- Bump search-index to version **v1.39.0**
- Fix escape bug on Firefox


# v0.4 - 2019-11-01

**v0.4** was a minor bug fix version released at `2019-11-01`.

- Fix offline mode search bug
- Offline doc path support `file://` and `http://` 

# v0.3 - 2019-10-29

After long time inactivity. The **v0.3** gets released at `2019-10-29` with an announcing on [Reddit post](https://www.reddit.com/r/rust/comments/dp1ru6/i_published_a_handy_chromefirefox_extension_to/).  

- Bump search-index to stable version **v1.38.0**
- Support search [Compiler Error Index](https://doc.rust-lang.org/error-index.html) with error code
- Published to Firefox [AMO](https://addons.mozilla.org/en-US/firefox/addon/rust-search-extension/)

# v0.2 - 2019-02-03

The version **v0.2** was released at `2019-02-03`.

- Update search-index to version **v1.32.0**
- Support configure offline doc path

# v0.1 - 2018-11-29

The first version **v0.1** was released at `2018-11-29` with a debut show on [Rust Internals Forum](https://internals.rust-lang.org/t/a-handy-browser-extension-to-search-crates-and-official-docs-in-address-bar-omnibox/8920).

This version only ships the very basic capabilities, including:

- Integrate Rust stable **v1.31.0** search-index
- Support search docs in the address bar.
- Support search crates on [https://crates.io](https://crates.io)
- Available on [Chrome Webstore](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)
- Support Firefox but didn't publish it to [AMO](https://addons.mozilla.org/) yet