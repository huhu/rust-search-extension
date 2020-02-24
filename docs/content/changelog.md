+++
title = "Changelog"
weight = 2
+++

# v0.8 - 2020-02-25

- Bump crates index number from top 10K to top 20K
- Display crate's **Features flags** in [docs.rs](https://docs.rs) page
- Support prefix **!!** (double exclamation mark) to search crates with [docs.rs](https://docs.rs) url
- Support prefix **%** (percent mark) to search Rust official book chapters
- Add nice features by introducing the command system
    - Add `:help` command to show all help messages
    - Add `:book` command to show all Rust official books
    - Add `:stable` command to show stable Rust scheduled release date in the next year
    - Add `:yet` command to show all **Are We Yet** websites
- Support page down the result with page-tuner **-** (hyphen or minus)

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