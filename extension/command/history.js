class HistoryCommand extends Command {
    constructor() {
        super("history", "Show your local search history.", false);
    }

    onExecute(arg) {
        let history = JSON.parse(localStorage.getItem("history")) || [];
        return history
            .filter(item => !arg || item.query.toLowerCase().indexOf(arg) > -1)
            .sort((a, b) => b.time - a.time)
            .map(item => {
                return {
                    content: item.content,
                    description: `${item.query} - ${item.description}`
                }
            });
    }

    onBlankResult(arg) {
        return [{
            content: "no history",
            description: "No history right now, let's search something!"
        }];
    }

    static record(query, result) {
        // Ignore the command history
        if (query.startsWith(":") || !result) return;
        let history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({query, ...result, time: Date.now()});
        localStorage.setItem("history", JSON.stringify(history));
    }
}