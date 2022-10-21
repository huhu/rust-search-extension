class HelpCommand extends Command {
    constructor() {
        super("help", "Show the help messages.")
    }

    async onExecute() {
        const value = {
            "https://rust.extension.sh/": "Open plugin documentation",
            "tips1": `Tips: You can use shortcut ${c.match("Cmd")}/${c.match("Ctrl")} + ${c.match("L")} to autofocus the address bar`,
            "tips2": `Tips: Combine ${c.match("Cmd")} or ${c.match("Alt")} with ${c.match("Enter")} to open the search result in the new tab`,
            ":": `Prefix ${c.match(":")} to execute command (:cargo, :book, :yet, :stable, etc)`,
            "/": `Prefix ${c.match("/")} to search nightly rust docs, prefix ${c.match("//")} to search nightly rustc docs`,
            "!": `Prefix ${c.match("!")} to search docs.rs, prefix ${c.match("!!")} to search crates.io, prefix ${c.match("!!!")} can redirect to the repository`,
            "~": `Prefix ${c.match("~")} to search external crate's docs`,
            "@": `Prefix ${c.match("@crate")} (${c.dim("e.g. @tokio")}) to search that crate's doc exclusively`,
            "#": `Prefix ${c.match("#")} to search builtin attributes`,
            "%": `Prefix ${c.match("%")} to search Rust official book chapters`,
            ">": `Prefix ${c.match(">")} to search Rust clippy lints`,
            "?": `Prefix ${c.match("?")} to search caniuse.rs, prefix ${c.match("??")} can redirect to the RFC page`,
            "1.": `Input ${c.match("Rust version")} (${c.dim("e.g. 1.42.0")}) to open its release page`,
        };
        return Object.entries(value).map(([key, description], index) => {
            return { content: key, description };
        });
    }
}