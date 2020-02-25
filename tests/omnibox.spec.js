describe("Omnibox", function() {
    before(function() {
        this.omnibox = new Omnibox(new Compat());
    });
    describe(".parse()", function() {
        let inputs = [
            ["cfg", {query: "cfg", page: 1}],
            [" cfg ", {query: "cfg", page: 1}],
            ["!actix", {query: "!actix", page: 1}],
            ["!actix -", {query: "!actix", page: 2}],
            ["!actix --", {query: "!actix", page: 3}],
            [":book rust", {query: ":book rust", page: 1}],
            [":book rust ", {query: ":book rust", page: 1}],
            [":book rust - ", {query: ":book rust", page: 2}],
            [":book rust -xx ", {query: ":book rust", page: 2}],
            [":book rust -xx- ", {query: ":book rust", page: 3}],
        ];
        inputs.forEach(([input, result]) => {
            it(`Omnibox parse "${input}"`, function() {
                this.omnibox.parse(input).should.deep.equal(result);
            });
        });

    });
});