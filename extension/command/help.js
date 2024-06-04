import Command from "../core/command/base.js";

export default class HelpCommand extends Command {
    constructor() {
        super("help", "Show the help messages.")
    }

    async onExecute() {
        const value = {
            "https://rust.extension.sh/": "Open plugin documentation",
            "tips1": `Tips: You can use shortcut <match>Cmd</match>/<match>Ctrl</match> + <match>L</match> to autofocus the address bar`,
            "tips2": `Tips: Combine <match>Cmd</match> or <match>Alt</match> with <match>Enter</match> to open the search result in the new tab`,
            ":": `Prefix <match>:</match> to execute command (:cargo, :book, :yet, :stable, etc)`,
            "/": `Prefix <match>/</match> to search nightly rust docs`,
            "!": `Prefix <match>!</match> to search docs.rs, prefix <match>!!</match> to search crates.io, prefix <match>!!!</match> can redirect to the repository`,
            "~": `Prefix <match>~</match> to search external crate's docs`,
            "@": `Prefix <match>@crate</match> (<dim>e.g. @tokio</dim>) to search that crate's doc exclusively`,
            "#": `Prefix <match>#</match> to search builtin attributes`,
            "%": `Prefix <match>%</match> to search Rust book chapters`,
            ">": `Prefix <match>></match> to search Rust clippy lints`,
            "?": `Prefix <match>?</match> to search caniuse.rs`,
        };
        return Object.entries(value).map(([key, description], index) => {
            return { content: key, description };
        });
    }
};