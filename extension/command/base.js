class Command {
    constructor(name, description, wrap = false) {
        this.name = name;
        this.description = description;
        this.wrap = wrap;
    }

    onExecute(arg) {
    }

    // A hook method called when the onExecute()'s result is empty.
    onBlankResult(arg) {
    }
}