class HelpCommand extends Command {
    constructor() {
        super("help", "Show the help messages.")
    }

    onExecute() {
        const value = ([
            `Prefix ${c.match(":")} to execute command (:book, :yet, :stable, etc)`,
            `Prefix ${c.match("/")} to search nightly rust docs`,
            `Prefix ${c.match("!")} to search crates, prefix ${c.match("!!")} to search crates's docs, prefix ${c.match("!!!")} can redirect to the repository`,
            `Prefix ${c.match("~")} to search external crate's docs`,
            `Prefix ${c.match("@crate")} (${c.dim("e.g. @tokio")}) to search that crate's doc exclusively`,
            `Prefix ${c.match("#")} to search builtin attributes`,
            `Prefix ${c.match("%")} to search Rust official book chapters`,
            `Prefix ${c.match(">")} to search Rust clippy lints`,
            `[WIP] Prefix ${c.match("?")} to search Rust tracking issues`,
        ]);
        return value.map((description, index) => {
            return {content: `${index + 1}`, description};
        });
    }
}