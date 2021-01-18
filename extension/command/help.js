class HelpCommand extends Command {
    constructor() {
        super("help", "Show the help messages.")
    }

    onExecute() {
        const value = {
            ":": `Prefix ${c.match(":")} to execute command (:cargo, :book, :yet, :stable, etc)`,
            "/": `Prefix ${c.match("/")} to search nightly rust docs, prefix ${c.match("//")} to search nightly rustc docs`,
            "!": `Prefix ${c.match("!")} to search docs.rs, prefix ${c.match("!!")} to search crates.io, prefix ${c.match("!!!")} can redirect to the repository`,
            "~": `Prefix ${c.match("~")} to search external crate's docs`,
            "@": `Prefix ${c.match("@crate")} (${c.dim("e.g. @tokio")}) to search that crate's doc exclusively`,
            "#": `Prefix ${c.match("#")} to search builtin attributes`,
            "%": `Prefix ${c.match("%")} to search Rust official book chapters`,
            ">": `Prefix ${c.match(">")} to search Rust clippy lints`,
            "?": `Prefix ${c.match("?")} to search caniuse.rs, prefix ${c.match("??")} can redirect to the RFC page`,
        };
        return Object.entries(value).map(([key, description], index) => {
            return {content: key, description};
        });
    }
}