import { Compat } from "../core/index.js";
import Command from "../core/command/base.js";
import { getScheduledVersions } from "../rust-version.js";

export default class StableCommand extends Command {
    constructor() {
        super("stable", "Show stable Rust scheduled release date.")
    }

    async onExecute(arg) {
        let versions = getScheduledVersions(100)
            .map(version => `Version <match>${version.number}</match> scheduled release on <match>${Compat.normalizeDate(version.date)}</match>`)
        return this.wrap(versions);
    }
};