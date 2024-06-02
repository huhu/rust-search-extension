import Command from "../core/command/base.js";

export default class RustcCommand extends Command {
    constructor(index) {
        super("rustc", "Search rustc codegen options and lints.");
        this.docs = [];
        Object.entries(index).forEach(([kind, data]) => {
            data.items.forEach(name => {
                this.docs.push({
                    url: `${data.url}#${name}`,
                    kind,
                    name,
                });
            });
        });
    }

    async onExecute(arg) {
        return this.docs
            .filter(({ kind, name }) => !arg || `${kind}: ${name}`.toLowerCase().indexOf(arg) > -1)
            .map(doc => {
                return {
                    content: doc.url,
                    description: `${doc.kind}: <match>${doc.name}</match>`,
                };
            });
    }
};