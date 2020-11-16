// https://github.com/rust-lang/cargo/wiki/Third-party-cargo-subcommands
let subcommands = [];
let subcommandIndex = document.querySelectorAll('.markdown-body>ul>li');
for (let node of subcommandIndex) {
    let a = node.firstElementChild;
    let text = node.textContent.split(' - ');
    text.shift();
    subcommands.push([prefixCargoSubcommandName(a.textContent), a.href, text.join()]);
}

function prefixCargoSubcommandName(name) {
    if (!name.startsWith("cargo")) {
        return `cargo-${name}`;
    }
    return name;
}

console.log(JSON.stringify(subcommands));