+++
title = "Rust Search Extension"
sort_by = "weight"
+++

# Search docs

We support search all kinds of Rust docs blaze-fastly. Those docs including:

- The **stable**/**nightly** documentation of official crates (including **std**, **proc_macro**, **test**).
- All external docs on [docs.rs](https://docs.rs).
- All **rustc** crates docs.

> We'll sync the latest **std**/**nightly** search index automatically every day to ensure the docs freshness.
> There is no extension updating required to get the latest search index since v1.0.

## Search Primitive Types and Modules

![GIF](/primary-module.gif)

## Search Structs, Traits and Enums

![GIF](/struct-traits.gif)

## Search Functions, Methods and Macros

![GIF](/function-macros.gif)

## Search nightly docs

You can prefix a **/** (slash) before the keyword to search nightly docs. 

## Search rustc docs

You can prefix a **//** (double slash) before the keyword to search all of 
crates [docs of **rustc**](https://doc.rust-lang.org/nightly/nightly-rustc/), 
such as *rustc_mir*, *rustc_hir*, or *rustc_ast*, etc.

> It makes no sense to have a built-in search-index of **rustc** since the **rustc** is changed 
> very frequently. Therefore, you need to open the **rustc** docs page in advance to sync the 
> search-index before you search **rustc** docs. However, the search-index of **rustc** is very big, 
> we never persist it to the local storage (due to the limited storage size available 
> to browser extension).

![IMG](/search-rustc-docs.png)

## Search with type mode

You can prefix a type to get the exclusive search result. Those type keywords including:
- **mod**
- **struct**
- **enum**
- **fn**
- **trait**
- **type**
- **macro**
- **const**

For example, `fn:asref` to search function or `trait:iterator` to search trait.

![GIF](/type-mode.gif)

## Source code mode

Since **v1.2**, we can straight open the source code page for our docs search result.
Simply prefix `src:` (or `s:`, an alias to `src:`) before the keyword, you'll be 
redirected to the correct source code line of your search result after you press `Enter`.
For example, input `src:try_fold` or `s:try_fold`, you'll open the source code line of `std::iter::Iterator::try_fold()`. 

## Offline mode: search local Rust docs

You can run command `rustup doc --std` to open the offline std docs. 
To enable the offline mode, you should check the checkbox and input the offline docs path on the settings page. 
However, please check the [Caveats](/faq/#caveats) if you are a Firefox user.

![GIF](/offline-mode.gif)

## Search external crate docs

After you [add the crate to extension](#add-your-favorite-crate-to-extension), you can prefix **@crate-name** to search
the docs exclusive to that crate. For example, input `@tokio spawn` to search docs of **tokio**. 

![GIF](/search-crate-docs.gif)

**~** is another pretty prefix to search the external crate docs. Unlike the **@** prefix, **~**
gives you the power to search docs across all your favorite crates effortlessly. 

For example, input `~spawn`, you can get results related to "spawn" from all your favorite crates 
(e.g. **tokio**, **async_std**, **smol**, and **futures** ). 

![IMG](/tide-search.png)

# Search builtin attributes

Search builtin attributes (such as `derive`, `non_exhaustive`) are also supported, 
by default, the result is mixed with other related docs or crates though. 

If you prefer to search attribute exclusively, prefix a **#** (pound sign) before the keyword to narrow the result.

![GIF](/search-attributes.gif)

# Search top 20K crates

We build top 20K crates index (near 50K in total on crates.io) once a day to help you search crates instantly. 
You can prefix an **!** (exclamation mark) before the keyword to search [docs.rs](https://docs.rs) exclusively, 
prefix one more **!** (double exclamation marks) to open [crates.io](https://crates.io) page,
prefix **!!!** (triple exclamation marks) to open crate's repository (See [Open repository quickly](/#open-repository-quickly)).

![GIF](/search-crates.gif)

# Search compiler error code

![GIF](/error-index.gif)

# Search Rust official book chapters

You can search all of Rust book chapters too! The result will show the title of the related page, 
parent chapter, and grandparent chapter. Don't forget the **%** is the prefix to perform the book searching.

![IMG](/search-book.png)

# Search Cargo Clippy lints

**>** (right angle bracket) is also a great prefix to help you search [Cargo Clippy lints](https://rust-lang.github.io/rust-clippy/master/) exclusively. 

![IMG](/search-clippy-lints.png)

# Search Caniuse.rs and RFC

You can search [caniuse.rs](https://caniuse.rs) and RFC with **?** and **??** prefix respectively.

![IMG](/search-caniuse.png)

# Search Rust Version

Just input any Rust version (such as `v1.38`) to open the release page of that version.

![](/search-rust-version.png)

# Commands system

The command system brings a handy set of useful and convenient commands to you. 
Each command starts with a **:** (colon), followed by the name, and function differently in individual.
Those commands including but not limited to:

- **:help** - Show the help messages. 
- **:blog** - Show all Rust release blog posts.
- **:cargo** - Show all useful third-party cargo subcommands. 
- **:yet** - Show all Are We Yet websites. 
- **:book** - Show all Rust official books. 
- **:stable** - Show stable Rust scheduled release date in the next year. 
- **:label** - Show all issue labels of rust-lang repository. 
- **:tool** - Show useful rust tools.
- **:mirror** - Show all Rust mirror websites.
- **:stats** - open search statistics page.
- **:update** - open the [update page](/update) to sync the latest index automatically.
- **:release** - Open rust-lang repository [release page](https://github.com/rust-lang/rust/blob/master/RELEASES.md).
- **:history** - Show your local search history.

![IMG](/command-system.gif)

# Rust docs enhancement

## Make all "since" and "issue" linkable

Two kinds of tags links to corresponding urls, including:

- **"since"** links to Github release page (works in docs page and source code page)
- **"issue"** links to Github issue (works in source code page)

![](/since-issue-links.png)

# Docs.rs enhancement

## Display Feature Flags

Docs.rs don't display the crate's feature flags, which is inconvenient. So Rust Search Extension fills the gap.

![IMG](/feature-flags.png)

## Add your favorite crate to extension

By clicking the `+ to Rust Search Extension` button, you can add the crate to the extension, which brings the 
search capability for this crate on the address bar.

## Show Table of Content

![IMG](/docs-rs-toc.png)

# Rust repository enhancement

## Show Table of Content in the release page

![](/github-release-toc.png)

# Searching statistics

Searching statistics page provides a set of useful charts to visualize your search history. This gives you a 
powerful insight view on how frequency you search, how much valuable time you saved.

These charts including:

- A calendar heatmap represents your searching history in the last year
- A percentage chart reflects each category weight you searched
- Weekly, daily, and hourly bar chart tells you searching frequency in different time dimensionality
- Top searched crates chart gives you the rank of personal crate searching

![IMG](/statistic-1.png)
![IMG](/statistic-2.png)

# Miscellaneous

## Manage your indexed crates

![IMG](/crate-manage.png)

## Import/Export your data

![IMG](/import-export.png)

## Customize crates searching platform

You can customize your preferred crates searching platform such as [crates.io](https://crates.io)(default) 
or [lib.rs](https://lib.rs) on the settings page.

## Open repository quickly

You can prefix **!!!** (triple !) to open crate's repository quickly. 
For example, input `!!!tokio` then enter, the extension will obtain the repository url then redirect to 
the github repository page of **tokio** effortlessly.

## Page down/up easily

You can press `space` after the keyword, then increase or decrease the number of **-** (hyphen) to page down or page up.