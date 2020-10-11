class UpdateCommand extends Command {
    constructor() {
        super("update", "Update to the latest search index.");
    }

    onEnter(content, disposition) {
        Omnibox.navigateToUrl("https://rust.extension.sh/update", disposition);
    }

    onBlankResult(arg) {
        return [{
            content: ":update",
            description: `Press ${c.match("Enter")} to open search-index update page.`
        }];
    }
}