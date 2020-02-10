const c = new Compat();

function Command() {
    this.cmds = {
        "help": "Show the help messages.",
        "yet": "Show all the Are We X Yet websites.",
    };
}

Command.prototype.execute = function(query) {
    query = query.replace(":", "").trim();
    let [cmd, arg] = query.split(" ");
    if (cmd in this.cmds) {
        return this[cmd]();
    } else {
        return this.wrap([
            `Not command found ${c.match(":" + cmd)}, try following commands?`,
            ...Object.entries(this.cmds).map(([name, description]) => {
                return `${c.match(":" + name)} - ${c.dim(description)}`
            }),
        ]);
    }
};

// Wrap the result array with the default content,
// as the content is required by omnibox api.
Command.prototype.wrap = function(result) {
    return result.map((description, index) => {
        return {content: `help${index + 1}`, description};
    });
};

Command.prototype.help = function() {
    return this.wrap([
        `Prefix ${c.match(":")} to execute command (:help, :yet)`,
        `Prefix ${c.match("!")} to search crates, prefix ${c.match("!!")} to search crates's docs url`,
        `Prefix ${c.match("#")} to search builtin attributes`,
        `[WIP] Prefix ${c.match("@crate")} (${c.dim("e.g. @tokio")}) to search the dedicated crate's doc`,
        `[WIP] Prefix ${c.match("/")} to search official Rust project (rust-lang, rust-lang-nursery)`,
        `[WIP] Prefix ${c.match("?")} to search Rust tracking issues`,
        `[WIP] Prefix ${c.match(">")} to search Rust clippy lints`,
        `[WIP] Prefix ${c.match("%")} to search Rust book chapters`,
    ]);
};

Command.prototype.yet = function() {
    // https://wiki.mozilla.org/Areweyet
    const areweyet = [
        ["Are we async yet?", "Asynchronous I/O in Rust", "https://areweasyncyet.rs"],
        ["Are we audio yet?", "Audio related development in Rust", "https://areweaudioyet.com"],
        ["Are we game yet?", "Rust game development", "http://arewegameyet.com"],
        ["Are we GUI yet?", "Rust GUI development", "http://areweguiyet.com"],
        ["Are we IDE yet?", "Rust development environments", "http://areweideyet.com"],
        ["Are we learning yet?", "Rust machine learning ecosystem", "http://www.arewelearningyet.com"],
        ["Are we web yet?", "Rust libraries for web development", "http://arewewebyet.org"],
        ["Are we podcast yet?", "Rust Are We Podcast Yet", "https://soundcloud.com/arewepodcastyet"],
    ];
    return areweyet.map(([title, description, content]) => {
        return {
            content,
            description: `${title} - ${c.dim(description)}`,
        }
    });
};