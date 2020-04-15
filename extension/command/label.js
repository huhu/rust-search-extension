class LabelCommand extends Command {
    constructor(index) {
        super("label", "Show all issue labels of rust-lang repository.");
        this.labels = index.map(([name, description]) => {
            return {name, description};
        });
    }

    onExecute(arg) {
        let results = this.labels;
        if (arg) {
            results = [];
            for (let label of this.labels) {
                let index = label.name.toLowerCase().indexOf(arg);
                if (index > -1) {
                    label["matchIndex"] = index;
                    results.push(label);
                }
            }

            results = results.sort((a, b) => {
                if (a.matchIndex === b.matchIndex) {
                    return a.name.length - b.name.length;
                }
                return a.matchIndex - b.matchIndex;
            });
        }
        return results.map(label => {
            return {
                content: `https://github.com/rust-lang/rust/labels/${label.name}`,
                description: `${c.match(label.name)} - ${c.dim(c.escape(label.description))}`
            }
        });
    }
}