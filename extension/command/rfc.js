class RfcCommand extends SimpleCommand {
    constructor(index) {
        super("rfc", "Show the RFC index.");
        this.rfcs = index.map(([number, name, date, title]) => {
            return {number, name, date, title};
        });
    }

    onExecute(arg) {
        let results = this.rfcs;
        if (arg) {
            results = [];
            for (let rfc of this.rfcs) {
                rfc['numberMatchIndex'] = `${rfc.number}`.indexOf(arg);
                rfc["matchIndex"] = rfc.name.toLowerCase().indexOf(arg);
                results.push(rfc);
            }

            results = results.filter(rfc => rfc.numberMatchIndex !== -1 || rfc.matchIndex !== -1)
                .sort((a, b) => {
                    if (a.numberMatchIndex === b.numberMatchIndex) {
                        if (a.number === b.number) {
                            if (a.matchIndex === b.matchIndex) {
                                return a.name.length - b.name.length;
                            }
                            return a.matchIndex - b.matchIndex;
                        }
                        return a.number - b.number;
                    }
                    return a.numberMatchIndex - b.numberMatchIndex;
                });
        }
        return results.map(rfc => {
            let title = rfc.title ? `- ${c.dim(c.escape(rfc.title))}` : c.dim(c.escape(rfc.title));
            return {
                content: `https://www.ncameron.org/rfcs/${String(rfc.number).padStart(4, '0')}.html`,
                description: `${c.match("RFC " + rfc.number + ": ")} ${rfc.name} ${rfc.date} ${title}`
            }
        });
    }
}