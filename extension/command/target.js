import { c } from "../core/index.js";
import Command from "../core/command/base.js";

export default class TargetCommand extends Command {
    constructor(index) {
        super("target", "Search rust target for three tiers.");
        this.targets = [];
        Object.entries(index).forEach(([tier, data]) => {
            data.items.forEach(([name, description]) => {
                this.targets.push({
                    url: data.url,
                    tier,
                    name,
                    description,
                });
            })
        });
    }

    async onExecute(arg) {
        return this.targets
            .filter(({ tier, name, description }) => !arg || `${tier}: ${name} - ${description}`.toLowerCase().indexOf(arg) > -1)
            .map(target => {
                return {
                    content: target.url,
                    description: `${c.capitalize(target.tier)}: ${c.match(target.name)} - ${c.dim(target.description)}`,
                };
            });
    }
};