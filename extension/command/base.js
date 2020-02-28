class Command {
    constructor(name, description, wrap = false) {
        this.name = name;
        this.description = description;
        this.wrap = wrap;
    }

    onExecute(arg) {
    }
}