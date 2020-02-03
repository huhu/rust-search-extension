
![](assets/rustacean.gif)

# Rust Search Extension

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ennpfpdlaclocpomkiablnmbppdnlhoh.svg)
![Mozilla Add-on](https://img.shields.io/amo/v/rust-search-extension?color=%2320123A)
[![rust-doc](https://img.shields.io/badge/stable-1.41.0-yellow.svg)](https://doc.rust-lang.org/1.41.0/std/)
[![license-mit](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Folyd/rust-search-extension/blob/master/LICENSE-MIT)
[![license-apache](https://img.shields.io/badge/license-Apache-yellow.svg)](https://github.com/Folyd/rust-search-extension/blob/master/LICENSE-APACHE)
![Build Status](https://github.com/folyd/rust-search-extension/workflows/build/badge.svg)

🦀 A handy browser extension to search crates and docs in the address bar (omnibox).

[https://rust-search-extension.now.sh/](https://rust-search-extension.now.sh/)

### Installation

- [Chrome Web Store](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rust-search-extension/)

### Features

- Search Primitive Types and Modules
- Search Structs, Traits and Enums
- Search Functions, Methods and Macros
- Search builtin attributes 
- Search crates on https://crates.io
- Search [Compiler Error Index](https://doc.rust-lang.org/error-index.html) with error code
- Offline mode, search local Rust docs (`rustup docs --std`) (Some limitation on Firefox, see [Caveats](#caveats))
- Both Chrome and Firefox are supported

### Usages

Input keyword **rs** in the address bar, press `Tab` or `Space` to activate the search bar. Then enter any word 
you want to search, the extension will response the related search results instantly.

![demonstration.gif](assets/demonstration.gif)

# [Features overview](https://rust-search-extension.now.sh/)
# [How it works](https://rust-search-extension.now.sh/how-it-works/)
# [Release history](https://rust-search-extension.now.sh/release-history/)
# [Caveats](https://rust-search-extension.now.sh/how-it-works/#caveats)