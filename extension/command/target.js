class TargetCommand extends Command {
    constructor(index) {
        super("target", "Search rust target for three tiers.");
        this.targets = [];
        Object.entries(index).forEach(([tier, data]) => {
            data.items.forEach(([name, description]) => {
                this.targets.push({
                    content: data.url,
                    description: `${tier}: ${c.match(name)} - ${c.dim(description)}`,
                });
            })
        });
    }

    async onExecute(arg) {
        return this.targets
            .filter(({ description }) => !arg || description.toLowerCase().indexOf(arg) > -1);
    }
}