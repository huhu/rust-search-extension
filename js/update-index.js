import caniuseIndex from "../index/caniuse.js";
import booksIndex from "../index/books.js";
import commandsIndex from "../index/commands.js";
import labelsIndex from "../index/labels.js";
import lintsIndex from "../index/lints.js";
import rfcsIndex from "../index/rfcs.js";
import rustcIndex from "../index/rustc.js";
import targetsIndex from "../index/targets.js";
import { mapping, crateIndex } from "../crates/index.js";

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
    updateIndex("book", booksIndex).then(() => {
        renderSuccessMessage("Book index");
    });
    updateIndex("lint", lintsIndex).then(() => {
        renderSuccessMessage("Clippy lint index");
    });
    updateIndex("caniuse", caniuseIndex).then(() => {
        renderSuccessMessage("Caniuse index");
    });
    updateIndex("label", labelsIndex).then(() => {
        renderSuccessMessage("Github rust-lang/rust repository label index");
    });
    updateIndex("rfc", rfcsIndex).then(() => {
        renderSuccessMessage("Rust RFC index");
    });
    updateIndex("rustc", rustcIndex).then(() => {
        renderSuccessMessage("`:rustc` command index");
    });
    updateIndex("target", targetsIndex).then(() => {
        renderSuccessMessage("`:target` command index");
    });
    updateIndex("crate", crateIndex, { mapping: mapping }).then(() => {
        renderSuccessMessage("Top 20K crate index");
    });
    updateIndex("command", commandsIndex).then(() => {
        renderSuccessMessage("Command index");
    });

    let updateProgress = document.querySelector(".update-progress");
    updateProgress.textContent = "Update success! All your indexes are up to date!"
});