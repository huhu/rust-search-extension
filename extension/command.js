function Command() {}

Command.prototype.execute = function(query) {
    query = query.replace(":", "").trim();
    let [cmd, arg] = query.split(" ");
    switch (cmd) {
        case "yet": {
            return this.yet();
        }
        case "help": {
            return this.help();
        }
    }
};

Command.prototype.help = function() {
    return [
        {content: "help", description: "Prefix : to execute command (:help, :yet)"},
        {content: "help1", description: "Prefix ! to search crates, prefix !! to search crates's docs url"},
        {content: "help2", description: "Prefix # to search builtin attributes"},
        {content: "help7", description: "[WIP] Prefix @ and crate name to that crate's doc"},
        {content: "help3", description: "[WIP] Prefix / to search official Rust project (rust-lang, rust-lang-nursery)"},
        {content: "help4", description: "[WIP] Prefix ? to search tracking issues"},
        {content: "help5", description: "[WIP] Prefix > to search clippy lints"},
        {content: "help6", description: "[WIP] Prefix % to search Rust book chapters"},
    ]
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
    let result = [];
    for (let [title, description, content] of areweyet) {
        result.push({
            content,
            description: title + description,
        });
    }
    return result;
};