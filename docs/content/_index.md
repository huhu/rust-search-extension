+++
title = "Rust Search Extension"
sort_by = "weight"
+++

Currently，we only support search documentation of those official crates:
- **std**
- **proc_macro**
- **test**

# Search Primitive Types and Modules

![GIF](/primary-module.gif)

# Search Structs, Traits and Enums

![GIF](/struct-traits.gif)

# Search Functions, Methods and Macros

![GIF](/function-macros.gif)

# Search doc with type mode

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

# Search builtin attributes

Search builtin attributes (such as `derive`, `non_exhaustive`) are also supported, 
by default, the result is mixed with other related docs or crates though. 

If you prefer to search attribute exclusively, prefix a **#** (pound sign) before the keyword to narrow the result.

![GIF](/search-attributes.gif)

# Search top 20K crates

We build top 20K crates index (more than 35K in total on crates.io) every 12 hours to help you search crates instantly. 
You can open the popup page to sync the latest crates index automatically. ([Some caveats](/how-it-works/#caveats) 
for Firefox users.)

What more, you can prefix an **!** (exclamation mark) before the keyword to search crates exclusively, 
prefix one more **!** (double exclamation mark) to open [docs.rs](https://docs.rs) page instead [crates.io](https://crates.io) page!

![GIF](/search-crates.gif)

# Search Compiler Error Index

![GIF](/error-index.gif)

# Search Rust official book chapters

You can search all of Rust book chapters too! The result will show the title of the related page, 
parent chapter, and grandparent chapter.

![IMG](/search-book.png)

# Offline mode, search local Rust docs

You can run command `rustup doc --std` to open the offline std docs. 
To enable the offline mode, you should check the checkbox and input the offline docs path on the popup page. 
However, please check the [Caveats](/how-it-works/#caveats) if you are a Firefox user.  

![GIF](/offline-mode.gif)

# Display Feature Flags in docs.rs page

Feature flags are such a kind of crucial property we would involve in when we gain insight into a crate. 
However, docs.rs don't display the crate's feature flags, which is inconvenient. 
So Rust Search Extension fills the gap.

![IMG](/feature-flags.png)

# Command system

The command system brings a handy set of useful and convenient commands to you. 
Each command starts with a **:** (colon), followed by the name, and function differently in individual.
Those commands including but not limited to:

- **:help** - Show the help messages. 
- **:yet** - Show all Are We Yet websites. 
- **:book** - Show all Rust official books. 
- **:stable** - Show stable Rust scheduled release date in the next year. 

![IMG](/command-system.gif)

# Page down/up easily

You can press `space` after the keyword, then increase or decrease the number of **-** (hyphen) to page down or page up.