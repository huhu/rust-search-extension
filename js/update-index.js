const indexList = document.querySelector(".index-list");

function updateIndex(target, index, extra) {
    window.postMessage({
        direction: "rust-search-extension:update-index",
        message: {
            target,
            index,
            ...extra,
        },
    }, "*");
    return Promise.resolve();
}

function renderSuccessMessage(message) {
    let li = document.createElement("li");
    li.innerHTML = `<div>
                        <span>${message}</span> 
                        <img src="/check.svg" alt="" style="display: inline-block; width: auto;vertical-align: middle;">
                    </div>`;
    indexList.appendChild(li);
}

document.addEventListener("DOMContentLoaded", async () => {
    updateIndex("book", window.booksIndex).then(() => {
        renderSuccessMessage("Book index");
    });
    updateIndex("lint", window.lintsIndex).then(() => {
        renderSuccessMessage("Clippy lint index");
    });
    updateIndex("caniuse", window.caniuseIndex).then(() => {
        renderSuccessMessage("Caniuse index");
    });
    updateIndex("label", window.labelsIndex).then(() => {
        renderSuccessMessage("Github rust-lang/rust repository label index");
    });
    updateIndex("rfc", window.rfcsIndex).then(() => {
        renderSuccessMessage("Rust RFC index");
    });
    updateIndex("rustc", window.rustcIndex).then(() => {
        renderSuccessMessage("`:rustc` command index");
    });
    updateIndex("target", window.targetsIndex).then(() => {
        renderSuccessMessage("`:target` command index");
    });
    updateIndex("crate", window.crateIndex, { mapping: window.mapping }).then(() => {
        renderSuccessMessage("Top 20K crate index");
    });
    updateIndex("command", window.commandsIndex).then(() => {
        renderSuccessMessage("Command index");
    });

    let updateProgress = document.querySelector(".update-progress");
    updateProgress.textContent = "Update success! All your indexes are up to date!"
});