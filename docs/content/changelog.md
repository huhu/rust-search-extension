+++
title = "Changelog"
description = "Changelog"
weight = 3
+++

# v1.10.0 -2023-03-25

- Add security advisory menu to docs.rs ({{ issue(id=239) }})
  > ![](/security-advisory-menu.png)
- Support statistics by year ({{ issue(id=221) }})
- Support new error-index page ({{ issue(id=192) }})
- Support new search index format since 1.69 ({{ issue(id=233) }})
- Bugfix:
  - Make "add to extension" button vertically centered ({{ issue(id=220) }})
  - Fix `resourcePath()` null bug. Fix {{ issue(id=219) }}
  - Fix cargo book command ({{ issue(id=231) }}) ({{ issue(id=234) }})
  - Fix error code autoincreament bug
- Remove:
  - Remove :blog command ({{ issue(id=240) }})
  - Remove GitHub release page enhancement ({{ issue(id=241) }})
  - Remove search rust version feature

Thanks for the contributions from [@shwin0901](https://github.com/shwin0901), [@duskmoon314](https://github.com/duskmoon314), and [@isunjn](https://github.com/isunjn).

# v1.9.0 - 2022-11-20

- Migrate to `chrome.storage.onChange` event to avoid adding docs index failure ({{ issue(id=206) }}).
- Support search space-separated keywords.
- Cache feature flags in session storage.
- New commands:
  - `:rustc` - Search rustc codegen options and lints.
  - `:target` - Search rust target for three tiers.
  ![](/target-command.png)
- Add a pagination tip in the last page item.
- Remove prefix for RFC (??) & Improve docs ({{ issue(id=197) }}). 
- Condense attributes and crates index size.
- Make feature flag's name sticky left.
- Bugfix:
  - Fix error code regex.
  - Fix incorrect export of stats/history ({{ issue(id=203) }}) ({{ issue(id=204) }}). 
  - fix docs.rs show features ({{ issue(id=209) }}). 
  - Fix source code navigate bug. Fix ({{ issue(id=212) }}). 
  - Fix GitHub release page TOC compatibility ({{ issue(id=214) }}). 

Thanks for the contributions from [@shwin0901](https://github.com/shwin0901), [@light4](https://github.com/light4), and [@xxchan](https://github.com/xxchan).

## v1.9.1 - 2022-11-27

- Revert invalid levenshtein algorithm fix
- Feat rustc search appendix

# v1.8 - 2022-08-15

- Migrate to Manifest V3 ({{ issue(id=179) }}).
- Integrate [macro_railroad_ext](https://github.com/lukaslueg/macro_railroad_ext) ({{ issue(id=183) }}). Kudos to [@lukaslueg](https://github.com/lukaslueg).
  > ![](/railroad.jpg)
- Support options page. Fixes ({{ issue(id=133) }}).
- Replace 'crate:check' action with `chrome.storage` API query.
- Support the new search-index loading, see [rust-lang/rust#98124](https://github.com/rust-lang/rust/pull/98124).
- Add more books into `:book` command.
- Add `:book/zh` command to list Chinese books. ({{ issue(id=175) }}).
- Adjust margin of add to extension button ({{ issue(id=178) }}).
- Remove uninstall url. Close {{ issue(id=188) }}.
- Bugfix:
  - Fix default `offlineDocPath` undefine bug.
  - Don't load search index in non-rust doc pages.
  - Invalid cached crate searcher after crate search index updated or removed.

Thanks for the contributions from [@C-Dao](https://github.com/C-Dao), [@zjp-CN](https://github.com/zjp-CN), and [@ZhangHanDong](https://github.com/ZhangHanDong).

## v1.8.1 - 2022-08-17

- Remove `file:///*` permission. Fixes ({{ issue(id=190) }}).
- Add *Show Macro Railroad* options.
- Use rustwiki Chinese CDN. ({{ issue(id=190) }})

Thanks for the contributions from [@PureWhiteWu](https://github.com/PureWhiteWu).

## v1.8.2 - 2022-10-30

- Fix book index object field (`constructor`) conflicts bug

# v1.7 - 2022-06-06

- Remove the `tabs` permission requirement.
- Migrate `localStorage` to `chrome.storage` API ({{ issue(id=155) }}, {{ issue(id=157) }}, {{ issue(id=158) }}).
- Support update blog command posts index in [update page](/update).
- Bugfix:
  - Fix docs.rs TOC max-width and padding.
  - Only render `.top-doc` headings as TOC. Fixes {{ issue(id=152) }}.
  - Don't reposition feature flag menu. Fixes {{ issue(id=154) }}.
  - Fix search base iterate issue ({{ issue(id=159) }}).

# v1.6 - 2022-03-02

- Show optional dependencies in feature flags menu. Fixes {{ issue(id=29) }}.
  > ![](/optional-dependencies.png)
- Fix latest version parsing for crates with hyphens. Thanks the contribution {{ issue(id=147) }} from [@rrbutani](https://github.com/rrbutani).

# v1.5 - 2022-01-25

- Support customize default search items in settings. Fixes {{ issue(id=141) }}.
  > ![](/configure-default-search.png)
- Add docs outline highlight. Thanks the contribution {{ issue(id=140) }} from [@NaturelLee](https://github.com/NaturelLee).
- Bugfix:
  - Fix update label/rfc index bug.
  - Fix add to extension button toggle float issue.
  - Fix crate version parse bug.
  - Fix docs.rs TOC render and UI.

## v1.5.1 - 2022-02-01

- Improve `impl` blocks highlight effects. Fixes {{ issue(id=144) }}, {{ issue(id=145) }}.

# v1.4 - 2021-10-30

- New commands:
  - `:rfc`: show all Rust RFC list. Kudos to [nrc](https://github.com/nrc)'s [rfc-index](https://github.com/nrc/rfc-index) repository.
- Improvements:

  - Error code search supports offline mode.
  - Expand the `:stable` command result to 100 versions.
    > What a coincidence! Rust will release **v1.87.0** on its **10th** anniversary day!
    >
    > ![](/stable-command.png)

- Bugfix:
  - Fix docs.rs TOC overlap issue.
  - Fix weeks, hours, and dates statistics bug.
  - Fix percent statistics NAN bug. fix {{ issue(id=125) }}.
  - Fix **%** books search some invalid urls bug.

## v1.4.1 - 2021-12-30

- Fix {{ issue(id=134) }}, get the `searchIndexJs` from `window.searchIndexJs`.
- Fix {{ issue(id=135) }}, docs.rs latest version path compatibility.
- Filter out auto-generated google api crates. Fixes {{ issue(id=138) }}.

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
  - Github _rust-lang/rust_ repository label index
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
