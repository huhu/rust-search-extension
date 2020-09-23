class StatsCommand extends Command {
    constructor() {
        super("stats", "Open search statistics page.");
    }

    onEnter(content, disposition) {
        Omnibox.navigateToUrl(chrome.runtime.getURL("stats/index.html"), disposition);
    }

    onBlankResult(arg) {
        return [{
            content: ":stats",
            description: `Press ${c.match("Enter")} to open search statistics page.`
        }];
    }
}