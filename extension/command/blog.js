class BlogCommand extends Command {
    constructor(posts) {
        super("blog", "Show all Rust released blog posts.");
        this.posts = posts || [];
    }

    onExecute(arg) {
        let results = this.posts;
        if (arg) {
            results = [];
            for (let post of this.posts) {
                let index = post.title.toLowerCase().indexOf(arg);
                if (index > -1) {
                    post["matchIndex"] = index;
                    results.push(post);
                }
            }

            results = results.sort((a, b) => {
                return a.matchIndex - b.matchIndex;
            });
        }
        return results.map(post => {
            return {
                content: `https://blog.rust-lang.org/${post.url}`,
                description: `${c.match(post.title)} - ${c.dim(parseDate(post.url))}`
            }
        });
    }
}

function parseDate(url) {
    let [year, month, day] = url.split('/');
    return [year, month, day].join('-');
}