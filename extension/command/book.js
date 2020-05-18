class BookCommand extends Command {
    constructor() {
        super("book", "Show all Rust official books.");
    }
    onExecute(arg) {
        const books = [
            ["The Rust Programming Language", "https://doc.rust-lang.org/stable/book/"],
            ["Rust Async Book", "https://rust-lang.github.io/async-book/"],
            ["Rust Edition Guide Book", "https://doc.rust-lang.org/stable/edition-guide/"],
            ["The Cargo Book", "https://doc.rust-lang.org/cargo/index.html"],
            ["Rust and WebAssembly Book", "https://rustwasm.github.io/docs/book/"],
            ["The Embedded Rust Book", "https://rust-embedded.github.io/book/"],
            ["The Rust Cookbook", "https://rust-lang-nursery.github.io/rust-cookbook/"],
            ["Command line apps in Rust", "https://rust-cli.github.io/book/index.html"],
            ["Rust by Example", "https://doc.rust-lang.org/stable/rust-by-example/"],
            ["Rust RFC", "https://rust-lang.github.io/rfcs/"],
            ["The Rust Doc Book", "https://doc.rust-lang.org/rustdoc/index.html"],
            ["The rustc Book", "https://doc.rust-lang.org/rustc/index.html"],
            ["Guide to Rustc Development", "https://rustc-dev-guide.rust-lang.org/"],
            ["The Rust Reference", "https://doc.rust-lang.org/reference/index.html"],
            ["The Rustonomicon", "https://doc.rust-lang.org/nomicon/index.html"],
            ["The Unstable Book", "https://doc.rust-lang.org/unstable-book/index.html"],
            ["Rust bindgen User Guide", "https://rust-lang.github.io/rust-bindgen/"],
            ["The wasm-bindgen Guide", "https://rustwasm.github.io/docs/wasm-bindgen/"],
            ["Rust API Guidelines", "https://rust-lang.github.io/api-guidelines/"],
            ["Rust Fuzz Book", "https://rust-fuzz.github.io/book/"],
            ["Rust Forge Book", "https://forge.rust-lang.org/"],
        ];
        return books
            .filter(item => !arg || item[0].toLowerCase().indexOf(arg) > -1)
            .map(([name, url]) => {
                return {
                    content: url,
                    description: `${c.match(name)} - ${c.dim(url)}`,
                }
            });
    }
}