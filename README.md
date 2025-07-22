![](assets/rustacean.gif)

# Rust Search Extension

[简体中文](README-ZH.md)

### The ultimate search extension for Rust

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ennpfpdlaclocpomkiablnmbppdnlhoh.svg)](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)
[![Mozilla Add-on](https://img.shields.io/amo/v/rust-search-extension?color=%2320123A)](https://addons.mozilla.org/firefox/addon/rust-search-extension/)
[![Microsoft Edge](https://img.shields.io/badge/microsoft--edge-v2.0.2-1D4F8C)](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe)
[![license-mit](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-MIT)
[![license-apache](https://img.shields.io/badge/license-Apache-yellow.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-APACHE)
[![Discord](https://img.shields.io/discord/711895914494558250?label=chat&logo=discord)](https://discord.gg/xucZNVd)

Search **docs**, **crates**, builtin **attributes**, official **books**, and **error codes**, etc in your address bar instantly.

[https://rust.extension.sh/](https://rust.extension.sh/)

**Query.rs is the next generation search engine for Rust: https://query.rs**

## Installation

- [Chrome Web Store](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rust-search-extension/)

- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe)

## Features

- Search Primitive Types and Modules
- Search Structs, Traits and Enums
- Search Functions, Methods and Macros
- Search builtin attributes
- Search nightly and rustc docs
- Search crates on https://crates.io or https://lib.rs
- Search any third-party crate's docs
- Search [Compiler Error Index](https://doc.rust-lang.org/error-index.html) with error codes
- Search Rust official book chapters
- Search Cargo Clippy lints
- Search [Caniuse.rs](https://caniuse.rs) and RFC
- Offline mode supported, search local Rust docs (`rustup docs --std`)
- Builtin commands (`:yet`, `:book`, `:stable`, `:label`, `:tool`, `:mirror`, `:update` and `:history` etc)
- Docs.rs enhancements (display Feature flags, show table of content)
- Github rust-lang release page enhancements (show table of content)
- docs.rust-lang.org enhancements (link all "since" and "issue" label)
- Support import/export your local data

## How to use it

Input keyword **rs** in the address bar, press `Space` to activate the search bar. Then enter any word you want to search, the extension will response the related search results instantly.

![demonstration.gif](assets/demonstration.gif)

## Contribution

[jsonnet](https://jsonnet.org/) is required before getting started. To install `jsonnet`, please check `jsonnet`'s [README](https://github.com/google/jsonnet#packages).
For Linux users, the `snap` is a good choice to [install jsonnet](https://snapcraft.io/install/jsonnet/ubuntu).

```bash
$ git clone --recursive https://github.com/huhu/rust-search-extension
Cloning into 'rust-search-extension'...
$ cd rust-search-extension

$ make chrome # For Chrome version

$ make firefox # For Firefox version

$ make edge # For Edge version
```

## Get involved

You can contact us on Discord Channel: https://discord.gg/xucZNVd

## Miscellaneous

- [Changelog](https://rust.extension.sh/changelog/)
- [FAQ](https://rust.extension.sh/faq/)

## Thanks

Thanks for the sponsorship from these great companies.

[![](https://geddle.com/logo.svg)](https://geddle.com/?from=rust-search-extension)
[![](docs/static/bytebase.svg)](https://bytebase.com/?from=rust-search-extension)
