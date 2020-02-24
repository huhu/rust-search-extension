function Deminifier(mapping) {
    this.mapping = mapping;
}

Deminifier.prototype.deminify = function(rawDescription) {
    if (rawDescription === null) return null;
    // Regex to globally, case-sensitively match words.
    return rawDescription
        .replace(/[@$^&][0-9a-zA-Z]/g, (value) => {
            return this.mapping[value];
        });
};

Deminifier.prototype.setMapping = function(mapping) {
    this.mapping = mapping;
};