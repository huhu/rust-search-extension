
![](assets/rustacean.gif)

# Rust Search Extension 

### The ultimate search extension for Rust

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ennpfpdlaclocpomkiablnmbppdnlhoh.svg)](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)
[![Mozilla Add-on](https://img.shields.io/amo/v/rust-search-extension?color=%2320123A)](https://addons.mozilla.org/firefox/addon/rust-search-extension/)
[![Microsoft Edge](https://img.shields.io/badge/microsoft--edge-v1.8.1-1D4F8C)](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe)
[![license-mit](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-MIT)
[![license-apache](https://img.shields.io/badge/license-Apache-yellow.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-APACHE)
[![Discord](https://img.shields.io/discord/711895914494558250?label=chat&logo=discord)](https://discord.gg/xucZNVd)

在地址栏快速搜索 Rust 文档、crates、内置属性、官方书籍和错误码等

[https://rust.extension.sh/](https://rust.extension.sh/)

## 下载安装

- [Chrome Web Store](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rust-search-extension/)

- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe)

## 功能

- 搜索基本类型和模块
- 搜索 Structs, Traits 和 Enums
- 搜索函数、方法和宏
- 搜索内置属性
- 搜索 nightly 和 rustc 文档
- 搜索 https://crates.io 或 https://lib.rs 上的crates
- 支持搜索 docs.rs 上任意第三方 crate 的文档
- 支持搜索 [Compiler Error Index](https://doc.rust-lang.org/error-index.html) 上的错误代码
- 支持实时搜索 Rust 官方书籍的章节
- 支持搜索 Cargo Clippy lints
- 支持搜索 [Caniuse.rs](https://caniuse.rs) 和 RFC
- 支持离线模式，可以搜索本地 Rust 文档 (`rustup docs --std`)
- 内置命令 (`:yet`, `:book`, `:stable`, `:label`, `:tool`, `:mirror`,  `:update` 和 `:history`等)
- Docs.rs 加强，展示每一个 crate 的 Feature flags
- Github release 页面加强（展示所有 Rust 版本目录）
- docs.rust-lang.org 加强（链接所有 "since" 和 "issue" 标签）
- 支持导入、导出本地的数据

## 使用方法

在浏览器地址栏输入关键字 **rs**，然后敲击**空格键**就能激活查询功能，输入任何你想搜索的词，插件会即时返回相关搜索结果。

![demonstration.gif](assets/demonstration.gif)

## 贡献

```bash
$ git clone --recursive https://github.com/huhu/rust-search-extension
Cloning into 'rust-search-extension'...
$ cd rust-search-extension

$ make chrome # For Chrome version

$ make firefox # For Firefox version

$ make edge # For Edge version
```

## 联系

您可以通过 Discord 频道与我们联系： https://discord.gg/xucZNVd


## 其他

- [Changelog](https://rust.extension.sh/changelog/)
- [FAQ](https://rust.extension.sh/faq/)

## 感谢

感谢下列优秀企业的赞助

[![](docs/static/jetbrains.svg)](https://www.jetbrains.com/?from=rust-search-extension)

[![](docs/static/vercel.svg)](https://vercel.com?utm_source=rust-search-extension)
