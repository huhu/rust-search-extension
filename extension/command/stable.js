class StableCommand extends Command {
    constructor() {
        super("stable", "Show stable Rust scheduled release date.")
    }

    onExecute(arg) {
        let versions = getScheduledVersions(2 * c.omniboxPageSize())
            .map(version => `Version ${c.match(version.number)} scheduled release on ${c.match(c.normalizeDate(version.date))}`)
        return this.wrap(versions);
    }
}