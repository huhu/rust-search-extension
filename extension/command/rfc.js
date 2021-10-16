class RfcCommand extends SimpleCommand {
    constructor(index) {
        super("rfc", "Show the RFC index.");
        this.rfcs = index.map(([name, description]) => {
            return {name, description};
        });
    }

    onExecute(arg) {
        let results = this.rfcs;
        if (arg) {
            results = [];
            for (let label of this.rfcs) {
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