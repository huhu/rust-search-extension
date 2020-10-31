
![](assets/rustacean.gif)

# Rust Search Extension 

### The ultimate search extension for Rust

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ennpfpdlaclocpomkiablnmbppdnlhoh.svg)
![Mozilla Add-on](https://img.shields.io/amo/v/rust-search-extension?color=%2320123A)
![Microsoft Edge](https://img.shields.io/badge/microsoft--edge-v1.0.0-1D4F8C)
[![license-mit](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-MIT)
[![license-apache](https://img.shields.io/badge/license-Apache-yellow.svg)](https://github.com/huhu/rust-search-extension/blob/master/LICENSE-APACHE)
[![Discord](https://img.shields.io/discord/711895914494558250?label=chat&logo=discord)](https://discord.gg/xucZNVd)

在地址栏快速搜索Rust文档、crates、内置属性、官方书籍和错误码等

[https://rust.extension.sh/](https://rust.extension.sh/)

## 下载安装

- [Chrome Web Store](https://chrome.google.com/webstore/detail/rust-search-extension/ennpfpdlaclocpomkiablnmbppdnlhoh)

- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rust-search-extension/)

- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/olemfibpaicdoooacpfffccidjjagmoe)

## 功能

- 搜索基本类型和模块
- 搜索Structs, Traits和Enums
- 搜索函数、方法和宏
- 搜索内置属性
- 搜索nightly文档
- 搜索 https://crates.io 或 https://lib.rs 上的crates
- 支持搜索docs.rs上任意第三方crate的文档
- 支持搜索 [Compiler Error Index](https://doc.rust-lang.org/error-index.html) 上的错误代码
- 支持实时搜索Rust官方书籍的章节
- 支持搜索Cargo Clippy lints
- 支持搜索 [Caniuse.rs](https://caniuse.rs) 和 RFC
- 支持离线模式，可以搜索本地 Rust 文档 (`rustup docs --std`)
- 内置命令 (`:yet`, `:book`, `:stable`, `:book`, `:label`, `:tool`, `:mirror`,  `:update` 和 `:history`等)
- Docs.rs加强，展示每一个crate的Feature flags

## 使用方法

在浏览器地址栏输入关键字**rs**，然后敲击**空格键**就能激活查询功能，输入任何你想搜索的词，插件会即时返回相关搜索结果。

![demonstration.gif](assets/demonstration.gif)

## 图示

![diagram](assets/diagram.jpg)

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

- 您可以通过Discord频道与我们联系： https://discord.gg/xucZNVd
- 或添加微信： `huhu_io`，我们会邀请您加入我们的微信群


## 其他

- [Changelog](https://rust.extension.sh/changelog/)
- [FAQ](https://rust.extension.sh/faq/)

## 感谢

感谢下列优秀企业的赞助

[![](docs/static/jetbrains.svg)](https://www.jetbrains.com/?from=rust-search-extension)

[![](docs/static/vercel.svg)](https://vercel.com?utm_source=rust-search-extension)
