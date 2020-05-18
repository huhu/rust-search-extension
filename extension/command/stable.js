class StableCommand extends Command {
    constructor() {
        super("stable", "Show stable Rust scheduled release date in the next year.")
    }
    onExecute(arg) {
        let dates = [];
        let startVersion = 42;
        let end = new Date();
        end.setFullYear(end.getFullYear() + 1);
        let date = new Date("2020-03-12");
        let now = new Date();
        for (let v = 1; ; v++) {
            date.setDate(date.getDate() + 42);
            if (date > end) break;
            if (date >= now) {
                dates.push(`Version ${c.match("1." + (startVersion + v) + ".0")} scheduled release on ${c.match(c.normalizeDate(date))}`);
            }
        }
        return this.wrap(dates);    
    }
}