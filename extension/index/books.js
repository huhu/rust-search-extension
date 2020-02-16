[{"name":"The Rust Programming Language","url":"https://doc.rust-lang.org/stable/book/","chapters":[["The Rust Programming Language","title-page"],["Foreword","foreword"],["Introduction","ch00-00-introduction"],["1. Getting Started","ch01-00-getting-started"],["1.1. Installation","ch01-01-installation"],["1.2. Hello, World!","ch01-02-hello-world"],["1.3. Hello, Cargo!","ch01-03-hello-cargo"],["2. Programming a Guessing Game","ch02-00-guessing-game-tutorial"],["3. Common Programming Concepts","ch03-00-common-programming-concepts"],["3.1. Variables and Mutability","ch03-01-variables-and-mutability"],["3.2. Data Types","ch03-02-data-types"],["3.3. Functions","ch03-03-how-functions-work"],["3.4. Comments","ch03-04-comments"],["3.5. Control Flow","ch03-05-control-flow"],["4. Understanding Ownership","ch04-00-understanding-ownership"],["4.1. What is Ownership?","ch04-01-what-is-ownership"],["4.2. References and Borrowing","ch04-02-references-and-borrowing"],["4.3. The Slice Type","ch04-03-slices"],["5. Using Structs to Structure Related Data","ch05-00-structs"],["5.1. Defining and Instantiating Structs","ch05-01-defining-structs"],["5.2. An Example Program Using Structs","ch05-02-example-structs"],["5.3. Method Syntax","ch05-03-method-syntax"],["6. Enums and Pattern Matching","ch06-00-enums"],["6.1. Defining an Enum","ch06-01-defining-an-enum"],["6.2. The match Control Flow Operator","ch06-02-match"],["6.3. Concise Control Flow with if let","ch06-03-if-let"],["7. Managing Growing Projects with Packages, Crates, and Modules","ch07-00-managing-growing-projects-with-packages-crates-and-modules"],["7.1. Packages and Crates","ch07-01-packages-and-crates"],["7.2. Defining Modules to Control Scope and Privacy","ch07-02-defining-modules-to-control-scope-and-privacy"],["7.3. Paths for Referring to an Item in the Module Tree","ch07-03-paths-for-referring-to-an-item-in-the-module-tree"],["7.4. Bringing Paths Into Scope with the use Keyword","ch07-04-bringing-paths-into-scope-with-the-use-keyword"],["7.5. Separating Modules into Different Files","ch07-05-separating-modules-into-different-files"],["8. Common Collections","ch08-00-common-collections"],["8.1. Storing Lists of Values with Vectors","ch08-01-vectors"],["8.2. Storing UTF-8 Encoded Text with Strings","ch08-02-strings"],["8.3. Storing Keys with Associated Values in Hash Maps","ch08-03-hash-maps"],["9. Error Handling","ch09-00-error-handling"],["9.1. Unrecoverable Errors with panic!","ch09-01-unrecoverable-errors-with-panic"],["9.2. Recoverable Errors with Result","ch09-02-recoverable-errors-with-result"],["9.3. To panic! or Not To panic!","ch09-03-to-panic-or-not-to-panic"],["10. Generic Types, Traits, and Lifetimes","ch10-00-generics"],["10.1. Generic Data Types","ch10-01-syntax"],["10.2. Traits: Defining Shared Behavior","ch10-02-traits"],["10.3. Validating References with Lifetimes","ch10-03-lifetime-syntax"],["11. Writing Automated Tests","ch11-00-testing"],["11.1. How to Write Tests","ch11-01-writing-tests"],["11.2. Controlling How Tests Are Run","ch11-02-running-tests"],["11.3. Test Organization","ch11-03-test-organization"],["12. An I/O Project: Building a Command Line Program","ch12-00-an-io-project"],["12.1. Accepting Command Line Arguments","ch12-01-accepting-command-line-arguments"],["12.2. Reading a File","ch12-02-reading-a-file"],["12.3. Refactoring to Improve Modularity and Error Handling","ch12-03-improving-error-handling-and-modularity"],["12.4. Developing the Library’s Functionality with Test Driven Development","ch12-04-testing-the-librarys-functionality"],["12.5. Working with Environment Variables","ch12-05-working-with-environment-variables"],["12.6. Writing Error Messages to Standard Error Instead of Standard Output","ch12-06-writing-to-stderr-instead-of-stdout"],["13. Functional Language Features: Iterators and Closures","ch13-00-functional-features"],["13.1. Closures: Anonymous Functions that Can Capture Their Environment","ch13-01-closures"],["13.2. Processing a Series of Items with Iterators","ch13-02-iterators"],["13.3. Improving Our I/O Project","ch13-03-improving-our-io-project"],["13.4. Comparing Performance: Loops vs. Iterators","ch13-04-performance"],["14. More about Cargo and Crates.io","ch14-00-more-about-cargo"],["14.1. Customizing Builds with Release Profiles","ch14-01-release-profiles"],["14.2. Publishing a Crate to Crates.io","ch14-02-publishing-to-crates-io"],["14.3. Cargo Workspaces","ch14-03-cargo-workspaces"],["14.4. Installing Binaries from Crates.io with cargo install","ch14-04-installing-binaries"],["14.5. Extending Cargo with Custom Commands","ch14-05-extending-cargo"],["15. Smart Pointers","ch15-00-smart-pointers"],["15.1. Using Box to Point to Data on the Heap","ch15-01-box"],["15.2. Treating Smart Pointers Like Regular References with the Deref Trait","ch15-02-deref"],["15.3. Running Code on Cleanup with the Drop Trait","ch15-03-drop"],["15.4. Rc, the Reference Counted Smart Pointer","ch15-04-rc"],["15.5. RefCell and the Interior Mutability Pattern","ch15-05-interior-mutability"],["15.6. Reference Cycles Can Leak Memory","ch15-06-reference-cycles"],["16. Fearless Concurrency","ch16-00-concurrency"],["16.1. Using Threads to Run Code Simultaneously","ch16-01-threads"],["16.2. Using Message Passing to Transfer Data Between Threads","ch16-02-message-passing"],["16.3. Shared-State Concurrency","ch16-03-shared-state"],["16.4. Extensible Concurrency with the Sync and Send Traits","ch16-04-extensible-concurrency-sync-and-send"],["17. Object Oriented Programming Features of Rust","ch17-00-oop"],["17.1. Characteristics of Object-Oriented Languages","ch17-01-what-is-oo"],["17.2. Using Trait Objects That Allow for Values of Different Types","ch17-02-trait-objects"],["17.3. Implementing an Object-Oriented Design Pattern","ch17-03-oo-design-patterns"],["18. Patterns and Matching","ch18-00-patterns"],["18.1. All the Places Patterns Can Be Used","ch18-01-all-the-places-for-patterns"],["18.2. Refutability: Whether a Pattern Might Fail to Match","ch18-02-refutability"],["18.3. Pattern Syntax","ch18-03-pattern-syntax"],["19. Advanced Features","ch19-00-advanced-features"],["19.1. Unsafe Rust","ch19-01-unsafe-rust"],["19.2. Advanced Traits","ch19-03-advanced-traits"],["19.3. Advanced Types","ch19-04-advanced-types"],["19.4. Advanced Functions and Closures","ch19-05-advanced-functions-and-closures"],["19.5. Macros","ch19-06-macros"],["20. Final Project: Building a Multithreaded Web Server","ch20-00-final-project-a-web-server"],["20.1. Building a Single-Threaded Web Server","ch20-01-single-threaded"],["20.2. Turning Our Single-Threaded Server into a Multithreaded Server","ch20-02-multithreaded"],["20.3. Graceful Shutdown and Cleanup","ch20-03-graceful-shutdown-and-cleanup"],["21. Appendix","appendix-00"],["21.1. A - Keywords","appendix-01-keywords"],["21.2. B - Operators and Symbols","appendix-02-operators"],["21.3. C - Derivable Traits","appendix-03-derivable-traits"],["21.4. D - Useful Development Tools","appendix-04-useful-development-tools"],["21.5. E - Editions","appendix-05-editions"],["21.6. F - Translations of the Book","appendix-06-translation"],["21.7. G - How Rust is Made and “Nightly Rust”","appendix-07-nightly-rust"]]},{"name":"Rust Async Book","url":"https://rust-lang.github.io/async-book/","chapters":[["1. Getting Started","01_getting_started/01_chapter"],["1.1. Why Async?","01_getting_started/02_why_async"],["1.2. The State of Asynchronous Rust","01_getting_started/03_state_of_async_rust"],["1.3. async/.await Primer","01_getting_started/04_async_await_primer"],["1.4. Applied: HTTP Server","01_getting_started/05_http_server_example"],["2. Under the Hood: Executing Futures and Tasks","02_execution/01_chapter"],["2.1. The Future Trait","02_execution/02_future"],["2.2. Task Wakeups with Waker","02_execution/03_wakeups"],["2.3. Applied: Build an Executor","02_execution/04_executor"],["2.4. Executors and System IO","02_execution/05_io"],["3. async/await","03_async_await/01_chapter"],["4. Pinning","04_pinning/01_chapter"],["5. Streams","05_streams/01_chapter"],["5.1. Iteration and Concurrency","05_streams/02_iteration_and_concurrency"],["6. Executing Multiple Futures at a Time","06_multiple_futures/01_chapter"],["6.1. join!","06_multiple_futures/02_join"],["6.2. select!","06_multiple_futures/03_select"],["6.3. TODO: Spawning","404"],["6.4. TODO: Cancellation and Timeouts","404"],["6.5. TODO: FuturesUnordered","404"],["7. Workarounds to Know and Love","07_workarounds/01_chapter"],["7.1. Return Type Errors","07_workarounds/02_return_type"],["7.2. ? in async Blocks","07_workarounds/03_err_in_async_blocks"],["7.3. Send Approximation","07_workarounds/04_send_approximation"],["7.4. Recursion","07_workarounds/05_recursion"],["7.5. async in Traits","07_workarounds/06_async_in_traits"],["8. TODO: I/O","404"],["8.1. TODO: AsyncRead and AsyncWrite","404"],["9. TODO: Asynchronous Design Patterns: Solutions and Suggestions","404"],["9.1. TODO: Modeling Servers and the Request/Response Pattern","404"],["9.2. TODO: Managing Shared State","404"],["10. TODO: The Ecosystem: Tokio and More","404"],["10.1. TODO: Lots, lots more?...","404"]]},{"name":"Rust Edition Guide Book","url":"https://doc.rust-lang.org/stable/edition-guide/","chapters":[["Introduction","introduction"],["1. What are editions?","editions/index"],["1.1. Creating a new project","editions/creating-a-new-project"],["1.2. Transitioning an existing project to a new edition","editions/transitioning-an-existing-project-to-a-new-edition"],["2. Rust 2015","rust-2015/index"],["3. Rust 2018","rust-2018/index"],["3.1. 2018-Specific Changes","rust-2018/edition-changes"],["3.2. Module system","rust-2018/module-system/index"],["3.2.1. Raw identifiers","rust-2018/module-system/raw-identifiers"],["3.2.2. Path clarity","rust-2018/module-system/path-clarity"],["3.2.3. More visibility modifiers","rust-2018/module-system/more-visibility-modifiers"],["3.2.4. Nested imports with use","rust-2018/module-system/nested-imports-with-use"],["3.3. Error handling and panics","rust-2018/error-handling-and-panics/index"],["3.3.1. The ? operator for easier error handling","rust-2018/error-handling-and-panics/the-question-mark-operator-for-easier-error-handling"],["3.3.2. ? in main and tests","rust-2018/error-handling-and-panics/question-mark-in-main-and-tests"],["3.3.3. Controlling panics with std::panic","rust-2018/error-handling-and-panics/controlling-panics-with-std-panic"],["3.3.4. Aborting on panic","rust-2018/error-handling-and-panics/aborting-on-panic"],["3.4. Control flow","rust-2018/control-flow/index"],["3.4.1. Loops can break with a value","rust-2018/control-flow/loops-can-break-with-a-value"],["3.4.2. async/await for easier concurrency","rust-2018/control-flow/async-await-for-easier-concurrency"],["3.5. Trait system","rust-2018/trait-system/index"],["3.5.1. impl Trait for returning complex types with ease","rust-2018/trait-system/impl-trait-for-returning-complex-types-with-ease"],["3.5.2. dyn Trait for trait objects","rust-2018/trait-system/dyn-trait-for-trait-objects"],["3.5.3. More container types support trait objects","rust-2018/trait-system/more-container-types-support-trait-objects"],["3.5.4. Associated constants","rust-2018/trait-system/associated-constants"],["3.5.5. No more anonymous parameters","rust-2018/trait-system/no-anon-params"],["3.6. Slice patterns","rust-2018/slice-patterns"],["3.7. Ownership and lifetimes","rust-2018/ownership-and-lifetimes/index"],["3.7.1. Non-lexical lifetimes","rust-2018/ownership-and-lifetimes/non-lexical-lifetimes"],["3.7.2. Default match bindings","rust-2018/ownership-and-lifetimes/default-match-bindings"],["3.7.3. '_, the anonymous lifetime","rust-2018/ownership-and-lifetimes/the-anonymous-lifetime"],["3.7.4. Lifetime elision in impl","rust-2018/ownership-and-lifetimes/lifetime-elision-in-impl"],["3.7.5. T: 'a inference in structs","rust-2018/ownership-and-lifetimes/inference-in-structs"],["3.7.6. Simpler lifetimes in static and const","rust-2018/ownership-and-lifetimes/simpler-lifetimes-in-static-and-const"],["3.8. Data types","rust-2018/data-types/index"],["3.8.1. Field init shorthand","rust-2018/data-types/field-init-shorthand"],["3.8.2. ..= for inclusive ranges","rust-2018/data-types/inclusive-ranges"],["3.8.3. 128 bit integers","rust-2018/data-types/128-bit-integers"],["3.8.4. \"Operator-equals\" are now implementable","rust-2018/data-types/operator-equals-are-now-implementable"],["3.8.5. union for an unsafe form of enum","rust-2018/data-types/union-for-an-unsafe-form-of-enum"],["3.8.6. Choosing alignment with the repr attribute","rust-2018/data-types/choosing-alignment-with-the-repr-attribute"],["3.9. SIMD for faster computing","rust-2018/simd-for-faster-computing"],["3.10. Macros","rust-2018/macros/index"],["3.10.1. Custom Derive","rust-2018/macros/custom-derive"],["3.10.2. Macro changes","rust-2018/macros/macro-changes"],["3.10.3. At most one repetition","rust-2018/macros/at-most-once"],["3.11. The compiler","rust-2018/the-compiler/index"],["3.11.1. Improved error messages","rust-2018/the-compiler/improved-error-messages"],["3.11.2. Incremental Compilation for faster compiles","rust-2018/the-compiler/incremental-compilation-for-faster-compiles"],["3.11.3. An attribute for deprecation","rust-2018/the-compiler/an-attribute-for-deprecation"],["3.12. Rustup for managing Rust versions","rust-2018/rustup-for-managing-rust-versions"],["3.13. Cargo and crates.io","rust-2018/cargo-and-crates-io/index"],["3.13.1. cargo check for faster checking","rust-2018/cargo-and-crates-io/cargo-check-for-faster-checking"],["3.13.2. cargo install for easy installation of tools","rust-2018/cargo-and-crates-io/cargo-install-for-easy-installation-of-tools"],["3.13.3. cargo new defaults to a binary project","rust-2018/cargo-and-crates-io/cargo-new-defaults-to-a-binary-project"],["3.13.4. cargo rustc for passing arbitrary flags to rustc","rust-2018/cargo-and-crates-io/cargo-rustc-for-passing-arbitrary-flags-to-rustc"],["3.13.5. Cargo workspaces for multi-package projects","rust-2018/cargo-and-crates-io/cargo-workspaces-for-multi-package-projects"],["3.13.6. Multi-file examples","rust-2018/cargo-and-crates-io/multi-file-examples"],["3.13.7. Replacing dependencies with patch","rust-2018/cargo-and-crates-io/replacing-dependencies-with-patch"],["3.13.8. Cargo can use a local registry replacement","rust-2018/cargo-and-crates-io/cargo-can-use-a-local-registry-replacement"],["3.13.9. Crates.io disallows wildcard dependencies","rust-2018/cargo-and-crates-io/crates-io-disallows-wildcard-dependencies"],["3.14. Documentation","rust-2018/documentation/index"],["3.14.1. New editions of the \"the book\"","rust-2018/documentation/new-editions-of-the-book"],["3.14.2. The Rust Bookshelf","rust-2018/documentation/the-rust-bookshelf"],["3.14.3. The Rustonomicon","rust-2018/documentation/the-rustonomicon"],["3.14.4. Full documentation for std::os","rust-2018/documentation/std-os-has-documentation-for-all-platforms"],["3.15. rustdoc","rust-2018/rustdoc/index"],["3.15.1. Documentation tests can now compile-fail","rust-2018/rustdoc/documentation-tests-can-now-compile-fail"],["3.15.2. Rustdoc uses CommonMark","rust-2018/rustdoc/rustdoc-uses-commonmark"],["3.16. Platform and target support","rust-2018/platform-and-target-support/index"],["3.16.1. libcore for low-level Rust","rust-2018/platform-and-target-support/libcore-for-low-level-rust"],["3.16.2. WebAssembly support","rust-2018/platform-and-target-support/webassembly-support"],["3.16.3. Global allocators","rust-2018/platform-and-target-support/global-allocators"],["3.16.4. MSVC toolchain support","rust-2018/platform-and-target-support/msvc-toolchain-support"],["3.16.5. MUSL support for fully static binaries","rust-2018/platform-and-target-support/musl-support-for-fully-static-binaries"],["3.16.6. cdylib crates for C interoperability","rust-2018/platform-and-target-support/cdylib-crates-for-c-interoperability"]]},{"name":"The Cargo Book","url":"https://doc.rust-lang.org/cargo/index.html","chapters":[["Introduction","index"],["1. Getting Started","getting-started/index"],["1.1. Installation","getting-started/installation"],["1.2. First Steps with Cargo","getting-started/first-steps"],["2. Cargo Guide","guide/index"],["2.1. Why Cargo Exists","guide/why-cargo-exists"],["2.2. Creating a New Package","guide/creating-a-new-project"],["2.3. Working on an Existing Package","guide/working-on-an-existing-project"],["2.4. Dependencies","guide/dependencies"],["2.5. Package Layout","guide/project-layout"],["2.6. Cargo.toml vs Cargo.lock","guide/cargo-toml-vs-cargo-lock"],["2.7. Tests","guide/tests"],["2.8. Continuous Integration","guide/continuous-integration"],["2.9. Cargo Home","guide/cargo-home"],["2.10. Build Cache","guide/build-cache"],["3. Cargo Reference","reference/index"],["3.1. Specifying Dependencies","reference/specifying-dependencies"],["3.2. The Manifest Format","reference/manifest"],["3.3. Profiles","reference/profiles"],["3.4. Configuration","reference/config"],["3.5. Environment Variables","reference/environment-variables"],["3.6. Build Scripts","reference/build-scripts"],["3.6.1. Build Script Examples","reference/build-script-examples"],["3.7. Publishing on crates.io","reference/publishing"],["3.8. Package ID Specifications","reference/pkgid-spec"],["3.9. Source Replacement","reference/source-replacement"],["3.10. External Tools","reference/external-tools"],["3.11. Registries","reference/registries"],["3.12. Unstable Features","reference/unstable"],["4. Cargo Commands","commands/index"],["4.1. Build Commands","commands/build-commands"],["4.1.1. bench","commands/cargo-bench"],["4.1.2. build","commands/cargo-build"],["4.1.3. check","commands/cargo-check"],["4.1.4. clean","commands/cargo-clean"],["4.1.5. doc","commands/cargo-doc"],["4.1.6. fetch","commands/cargo-fetch"],["4.1.7. fix","commands/cargo-fix"],["4.1.8. run","commands/cargo-run"],["4.1.9. rustc","commands/cargo-rustc"],["4.1.10. rustdoc","commands/cargo-rustdoc"],["4.1.11. test","commands/cargo-test"],["4.2. Manifest Commands","commands/manifest-commands"],["4.2.1. generate-lockfile","commands/cargo-generate-lockfile"],["4.2.2. locate-project","commands/cargo-locate-project"],["4.2.3. metadata","commands/cargo-metadata"],["4.2.4. pkgid","commands/cargo-pkgid"],["4.2.5. update","commands/cargo-update"],["4.2.6. vendor","commands/cargo-vendor"],["4.2.7. verify-project","commands/cargo-verify-project"],["4.3. Package Commands","commands/package-commands"],["4.3.1. init","commands/cargo-init"],["4.3.2. install","commands/cargo-install"],["4.3.3. new","commands/cargo-new"],["4.3.4. search","commands/cargo-search"],["4.3.5. uninstall","commands/cargo-uninstall"],["4.4. Publishing Commands","commands/publishing-commands"],["4.4.1. login","commands/cargo-login"],["4.4.2. owner","commands/cargo-owner"],["4.4.3. package","commands/cargo-package"],["4.4.4. publish","commands/cargo-publish"],["4.4.5. yank","commands/cargo-yank"],["4.5. General Commands","commands/general-commands"],["4.5.1. help","commands/cargo-help"],["4.5.2. version","commands/cargo-version"],["5. FAQ","faq"],["6. Appendix: Glossary","appendix/glossary"]]},{"name":"Rust and WebAssembly Book","url":"https://rustwasm.github.io/docs/book/","chapters":[["1. Introduction","introduction"],["2. Why Rust and WebAssembly?","why-rust-and-webassembly"],["3. Background And Concepts","background-and-concepts"],["3.1. What is WebAssembly?","what-is-webassembly"],["4. Tutorial","game-of-life/introduction"],["4.1. Setup","game-of-life/setup"],["4.2. Hello, World!","game-of-life/hello-world"],["4.3. Rules","game-of-life/rules"],["4.4. Implementing Life","game-of-life/implementing"],["4.5. Testing Life","game-of-life/testing"],["4.6. Debugging","game-of-life/debugging"],["4.7. Adding Interactivity","game-of-life/interactivity"],["4.8. Time Profiling","game-of-life/time-profiling"],["4.9. Shrinking .wasm Size","game-of-life/code-size"],["4.10. Publishing to npm","game-of-life/publishing-to-npm"],["5. Reference","reference/index"],["5.1. Crates You Should Know","reference/crates"],["5.2. Tools You Should Know","reference/tools"],["5.3. Project Templates","reference/project-templates"],["5.4. Debugging","reference/debugging"],["5.5. Time Profiling","reference/time-profiling"],["5.6. Shrinking .wasm Size","reference/code-size"],["5.7. JavaScript Interoperation","reference/js-ffi"],["5.8. Which Crates Will Work Off-the-Shelf with WebAssembly?","reference/which-crates-work-with-wasm"],["5.9. How to Add WebAssembly Support to a General-Purpose Crate","reference/add-wasm-support-to-crate"],["5.10. Deploying Rust and WebAssembly to Production","reference/deploying-to-production"]]},{"name":"The Embedded Rust Book","url":"https://rust-embedded.github.io/book/","chapters":[["1. Introduction","intro/index"],["1.1. Hardware","intro/hardware"],["1.2. no_std","intro/no-std"],["1.3. Tooling","intro/tooling"],["1.4. Installation","intro/install"],["1.4.1. Linux","intro/install/linux"],["1.4.2. MacOS","intro/install/macos"],["1.4.3. Windows","intro/install/windows"],["1.4.4. Verify Installation","intro/install/verify"],["2. Getting started","start/index"],["2.1. QEMU","start/qemu"],["2.2. Hardware","start/hardware"],["2.3. Memory-mapped Registers","start/registers"],["2.4. Semihosting","start/semihosting"],["2.5. Panicking","start/panicking"],["2.6. Exceptions","start/exceptions"],["2.7. Interrupts","start/interrupts"],["2.8. IO","start/io"],["3. Peripherals","peripherals/index"],["3.1. A first attempt in Rust","peripherals/a-first-attempt"],["3.2. The Borrow Checker","peripherals/borrowck"],["3.3. Singletons","peripherals/singletons"],["4. Static Guarantees","static-guarantees/index"],["4.1. Typestate Programming","static-guarantees/typestate-programming"],["4.2. Peripherals as State Machines","static-guarantees/state-machines"],["4.3. Design Contracts","static-guarantees/design-contracts"],["4.4. Zero Cost Abstractions","static-guarantees/zero-cost-abstractions"],["5. Portability","portability/index"],["6. Concurrency","concurrency/index"],["7. Collections","collections/index"],["8. Tips for embedded C developers","c-tips/index"],["9. Interoperability","interoperability/index"],["9.1. A little C with your Rust","interoperability/c-with-rust"],["9.2. A little Rust with your C","interoperability/rust-with-c"],["10. Unsorted topics","unsorted/index"],["10.1. Optimizations: The speed size tradeoff","unsorted/speed-vs-size"],["Appendix A: Glossary","appendix/glossary"]]},{"name":"The Rust Cookbook","url":"https://rust-lang-nursery.github.io/rust-cookbook/","chapters":[["Table of Contents","intro"],["About","about"],["1. Algorithms","algorithms"],["1.1. Generate Random Values","algorithms/randomness"],["1.2. Sort a Vector","algorithms/sorting"],["2. Command Line","cli"],["2.1. Argument Parsing","cli/arguments"],["2.2. ANSI Terminal","cli/ansi_terminal"],["3. Compression","compression"],["3.1. Working with Tarballs","compression/tar"],["4. Concurrency","concurrency"],["4.1. Explicit Threads","concurrency/threads"],["4.2. Data Parallelism","concurrency/parallel"],["5. Cryptography","cryptography"],["5.1. Hashing","cryptography/hashing"],["5.2. Encryption","cryptography/encryption"],["6. Data Structures","data_structures"],["6.1. Bitfield","data_structures/bitfield"],["7. Database","database"],["7.1. SQLite","database/sqlite"],["7.2. Postgres","database/postgres"],["8. Date and Time","datetime"],["8.1. Duration and Calculation","datetime/duration"],["8.2. Parsing and Displaying","datetime/parse"],["9. Development Tools","development_tools"],["9.1. Debugging","development_tools/debugging"],["9.1.1. Log Messages","development_tools/debugging/log"],["9.1.2. Configure Logging","development_tools/debugging/config_log"],["9.2. Versioning","development_tools/versioning"],["9.3. Build Time Tooling","development_tools/build_tools"],["10. Encoding","encoding"],["10.1. Character Sets","encoding/strings"],["10.2. CSV processing","encoding/csv"],["10.3. Structured Data","encoding/complex"],["11. Error Handling","errors"],["11.1. Handle Error Variants","errors/handle"],["12. File System","file"],["12.1. Read & Write","file/read-write"],["12.2. Directory Traversal","file/dir"],["13. Hardware Support","hardware"],["13.1. Processor","hardware/processor"],["14. Memory Management","mem"],["14.1. Global Static","mem/global_static"],["15. Network","net"],["15.1. Server","net/server"],["16. Operating System","os"],["16.1. External Command","os/external"],["17. Science","science"],["17.1. Mathematics","science/mathematics"],["17.1.1. Linear Algebra","science/mathematics/linear_algebra"],["17.1.2. Trigonometry","science/mathematics/trigonometry"],["17.1.3. Complex Numbers","science/mathematics/complex_numbers"],["17.1.4. Statistics","science/mathematics/statistics"],["17.1.5. Miscellaneous","science/mathematics/miscellaneous"],["18. Text Processing","text"],["18.1. Regular Expressions","text/regex"],["18.2. String Parsing","text/string_parsing"],["19. Web Programming","web"],["19.1. Extracting Links","web/scraping"],["19.2. URL","web/url"],["19.3. Media Types","web/mime"],["19.4. Clients","web/clients"],["19.4.1. Making Requests","web/clients/requests"],["19.4.2. Calling a Web API","web/clients/apis"],["19.4.3. Downloads","web/clients/download"]]}]