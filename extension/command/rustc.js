class RustcCommand extends Command {
    constructor(index) {
        super("rustc", "Search rustc codegen options and lints.");
        this.docs = [];
        Object.entries(index).forEach(([kind, data]) => {
            data.items.forEach(item => {
                this.docs.push({
                    content: `${data.url}#${item}`,
                    description: `${kind}: ${c.match(item)}`,
                });
            });
        });
    }

    async onExecute(arg) {
        return this.docs
            .filter(({ description }) => !arg || description.toLowerCase().indexOf(arg) > -1);
    }
}