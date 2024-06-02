import { Compat } from "../core/index.js";
import Command from "../core/command/base.js";

export default class LabelCommand extends Command {
    constructor(index) {
        super("label", "Search issue labels of rust-lang repository.");
        this.labels = index.map(([name, description]) => {
            return { name, description };
        });
    }

    async onExecute(arg) {
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
                description: `<match>${label.name}</match> - <dim>${Compat.escape(label.description)}</dim>`
            }
        });
    }
};