+++
title = "Rust Search Extension"
sort_by = "weight"
+++

# Search std and external crate docs

We support search documentation of official crates (including **std**, **proc_macro**, **test**) 
and any external crates on [docs.rs](https://docs.rs).

## Search Primitive Types and Modules

![GIF](/primary-module.gif)

## Search Structs, Traits and Enums

![GIF](/struct-traits.gif)

## Search Functions, Methods and Macros

![GIF](/function-macros.gif)

## Search with type mode

You can prefix a type to get the exclusive search result. Those type keywords including:
- mod
- struct
- enum
- fn
- trait
- type
- static
- macro
- const

For example, `fn:asref` to search function or `trait:iterator` to search trait.

![GIF](/type-mode.gif)

## Offline mode, search local Rust docs

You can run command `rustup doc --std` to open the offline std docs. 
To enable the offline mode, you should check the checkbox and input the offline docs path on the popup page. 
However, please check the [Caveats](/faq/#caveats) if you are a Firefox user.

![GIF](/offline-mode.gif)

## Search external crate's docs

After you [add the crate to extension](#add-crate-to-extension), you can prefix **@crate-name** to search the docs 
exclusive to that crate.

For example, input `@tokio spawn` to search docs of **tokio**.

![GIF](/search-crate-docs.gif)

# Search builtin attributes

Search builtin attributes (such as `derive`, `non_exhaustive`) are also supported, 
by default, the result is mixed with other related docs or crates though. 

If you prefer to search attribute exclusively, prefix a **#** (pound sign) before the keyword to narrow the result.

![GIF](/search-attributes.gif)

# Search top 20K crates

We build top 20K crates index (more than 35K in total on crates.io) once a day to help you search crates instantly. 
You can open the popup page to sync the latest crates index automatically. ([Some caveats](/faq/#caveats) 
for Firefox users.)

What more, you can prefix an **!** (exclamation mark) before the keyword to search crates exclusively, 
prefix one more **!** (double exclamation mark) to open [docs.rs](https://docs.rs) page instead [crates.io](https://crates.io) page!

![GIF](/search-crates.gif)

# Search compiler error code

![GIF](/error-index.gif)

# Search Rust official book chapters

You can search all of Rust book chapters too! The result will show the title of the related page, 
parent chapter, and grandparent chapter.

![IMG](/search-book.png)

# Search Cargo Clippy lints

![GIF](/search-clippy-lints.png)

# Commands system

The command system brings a handy set of useful and convenient commands to you. 
Each command starts with a **:** (colon), followed by the name, and function differently in individual.
Those commands including but not limited to:

- **:help** - Show the help messages. 
- **:yet** - Show all Are We Yet websites. 
- **:book** - Show all Rust official books. 
- **:stable** - Show stable Rust scheduled release date in the next year. 
- **:label** - Show all issue labels of rust-lang repository. 
- **:history** - Show your local search history

![IMG](/command-system.gif)

# Docs.rs enhancement

## Display Feature Flags

Docs.rs don't display the crate's feature flags, which is inconvenient. So Rust Search Extension fills the gap.

![IMG](/feature-flags.png)

## Add your favorite crate to extension

By clicking the `+ to Rust Search Extension` button, you can add the crate to the extension, which brings the 
search capability for this crate on the address bar.

# Searching statistics



# Miscellaneous

## Customize crates searching platform

You can customize your preferred crates searching platform such as [crates.io](https://crates.io)(default) 
or [lib.rs](https://lib.rs) on the popup page.

## Open repository quickly

You can prefix **!!!** (triple !) to open crate's repository quickly. 
For example, input `!!!tokio` and enter, the extension will obtain the repository url then redirect to 
the github repository page of **tokio** effortlessly.

## Page down/up easily

You can press `space` after the keyword, then increase or decrease the number of **-** (hyphen) to page down or page up.