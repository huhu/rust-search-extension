export default class Deminifier {
    constructor(mapping) {
        this.mapping = mapping;
    }

    deminify(rawDescription) {
        if (rawDescription === null) return null;
        // Regex to globally, case-sensitively match words.
        return rawDescription
            .replace(/[@$^&][0-9a-zA-Z]/g, (value) => {
                return this.mapping[value];
            });
    }

    setMapping(mapping) {
        this.mapping = mapping;
    }
};
