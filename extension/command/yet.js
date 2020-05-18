class YetCommand extends Command {
    constructor() {
        super("yet", "Show all Are We Yet websites.")
    }

    onExecute(arg) {
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
        return areweyet
            .filter(item => !arg || item[0].toLowerCase().indexOf(arg) > -1)
            .map(([title, description, content]) => {
                return {
                    content,
                    description: `${title} - ${c.dim(description)}`,
                }
            });
    }
}