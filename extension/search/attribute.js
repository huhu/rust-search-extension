const ATTRIBUTE_DOC_URL = "https://doc.rust-lang.org/nightly/reference/";

export default class AttributeSearch {
    constructor(index) {
        this.attributesIndex = index;
        this.attributes = Object.keys(index);
        this.attributes.sort();
    }

    search(keyword) {
        keyword = keyword.replace(/[-_\s#]/ig, "");
        let result = [];

        for (let rawAttribute of this.attributes) {
            let attribute = rawAttribute.replace(/[-_\s#]/ig, "");
            if (attribute.length < keyword.length) continue;

            let index = attribute.indexOf(keyword);
            if (index > -1) {
                result.push({
                    attribute: rawAttribute,
                    matchIndex: index,
                });
            }
        }
        // Sort the result, the lower matchIndex, the shorter length, the higher rank.
        return result.sort((a, b) => {
            if (a.matchIndex === b.matchIndex) {
                return a.attribute.length - b.attribute.length;
            }
            return a.matchIndex - b.matchIndex;
        })
            .map(item => {
                let [description, href] = this.attributesIndex[item.attribute];
                if (!href.startsWith('http')) {
                    href = ATTRIBUTE_DOC_URL + href;
                }
                return {
                    name: item.attribute,
                    description: description,
                    href: href,
                }
            });
    }
};