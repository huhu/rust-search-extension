function Deminifier(mapping) {
    this.mapping = mapping;
}

Deminifier.prototype.cleanMinifiedDescription = function(rawDescription) {
    if (rawDescription === null) return null;
    // Regex to globally, case-sensitively match words.
    // (?!\w) means: "Rust $AMZN $B of the Argon2 password hashing $L." will be replace
    // to "Rust $AMZN implementation of the Argon2 password hashing function."
    return rawDescription
        .replace(/(\$[0-9a-zA-Z](?!\w))+/g, (value) => {
            return this.mapping[value];
        });
};
