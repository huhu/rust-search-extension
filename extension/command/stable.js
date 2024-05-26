import { c } from "../core/index.js";
import Command from "../core/command/base.js";
import { getScheduledVersions } from "../rust-version.js";

export default class StableCommand extends Command {
    constructor() {
        super("stable", "Show stable Rust scheduled release date.")
    }

    async onExecute(arg) {
        let versions = getScheduledVersions(100)
            .map(version => `Version ${c.match(version.number)} scheduled release on ${c.match(c.normalizeDate(version.date))}`)
        return this.wrap(versions);
    }
};