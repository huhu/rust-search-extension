const indexList = document.querySelector(".index-list");

function updateIndex(target, index, ...extra) {
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

document.addEventListener("DOMContentLoaded", () => {
    updateIndex("crate", window.crateIndex, {mapping: window.mapping}).then(() => {
        renderSuccessMessage("Crate index");
    });
    updateIndex("book", window.booksIndex).then(() => {
        renderSuccessMessage("Book index");
    });
    updateIndex("lint", window.lintsIndex).then(() => {
        renderSuccessMessage("Clippy Lint index");
    });
    updateIndex("caniuse", window.caniuseIndex).then(() => {
        renderSuccessMessage("Caniuse index");
    });
    updateIndex("label", window.labelsIndex).then(() => {
        renderSuccessMessage("Github Label index");
    });

    let updateProgress = document.querySelector(".update-progress");
    updateProgress.textContent = "Update success! All your index is latest!"
});