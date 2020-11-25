class ReleaseCommand extends Command {
    constructor() {
        super("release", "Open rust-lang repository release page.");
    }

    onEnter(content, disposition) {
        Omnibox.navigateToUrl("https://github.com/rust-lang/rust/blob/master/RELEASES.md", disposition);
    }

    onBlankResult(arg) {
        return [{
            content: ":release",
            description: `Press ${c.match("Enter")} to open rust-lang repository release page.`
        }];
    }
}