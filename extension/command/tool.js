class ToolCommand extends Command {
    constructor() {
        super("tool", "Show some most useful Rust tools.");
    }

    onExecute(arg) {
        const tools = [
            ["Rust Playground", "https://play.rust-lang.org/"],
            ["cheats.rs", "https://cheats.rs/"],
            ["caniuse.rs", "https://caniuse.rs/"],
            ["Macro Railroad ", "https://lukaslueg.github.io/macro_railroad_wasm_demo/"],
        ];
        return tools
               .filter(item => !arg || item[0].toLowerCase().indexOf(arg) > -1)
               .map(([name,url]) => {
                   return {
                       content: url,
                       description: `${c.match(name)} - ${c.dim(url)}`
                   }
               })
    }
}