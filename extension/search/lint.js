export default class LintSearch {
    constructor(lintsIndex) {
        this.lintsIndex = lintsIndex;
        this.lints = Object.keys(this.lintsIndex);
    }

    search(keyword) {
        keyword = keyword.replace(/[-_\s>]/ig, "");
        let result = [];
        for (let rawLint of this.lints) {
            let lint = rawLint.replace(/[-_\s>]/ig, "");
            if (lint.length < keyword.length) continue;

            let index = lint.indexOf(keyword);
            if (index > -1) {
                result.push({
                    name: rawLint,
                    matchIndex: index,
                });
            }
        }

        return result.sort((a, b) => {
            if (a.matchIndex === b.matchIndex) {
                return a.name.length - b.name.length;
            }
            return a.matchIndex - b.matchIndex;
        }).map(item => {
            let [level, description] = this.lintsIndex[item.name];
            return {
                name: item.name,
                level,
                description,
            }
        });
    }
};
