describe("Deminifier", function() {
    before(function() {
        // runs before all tests in this block
        this.deminfier = new Deminifier(mapping);
        this.keys = Object.keys(mapping);
        this.crateIds = [];
        this.descriptions = [];
        for (let [crateId, [description, _]] of Object.entries(crateIndex)) {
            this.crateIds.push(crateId);
            if (description) this.descriptions.push(description);
        }
    });
    describe(".deminify()", function() {
        it("Deminify crate ids", function() {
            this.crateIds.forEach(crateId => {
                this.deminfier.deminify(crateId).should.not.have.oneOf(this.keys);
            });
        });
        it("Deminify crate descriptions", function() {
            this.descriptions.forEach(description => {
                this.deminfier.deminify(description).should.not.have.oneOf(this.keys);
            });
        });
    });
});