const TARGET = location.pathname.includes("/nightly/") ? "nightly" : "stable";

document.addEventListener("DOMContentLoaded", () => {
    // Ignore all non-rust doc pages.
    if (!isRustDoc()) return;

    if (location.pathname.startsWith("/0.")) {
        // Ignore legacy docs, such as 0.12.0. (https://doc.rust-lang.org/0.12.0/std/index.html)
        return;
    }

    if (["/src/", "/stable/src/", "/nightly/src/"].some(p => location.pathname.startsWith(p))) {
        // Source code pages
        linkSourcePageUrls();
    } else {
        // Docs page
        let version = localStorage.getItem(`rust-search-extension:${TARGET}`);
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        if (version && today <= Date.parse(version)) {
            // Check version between localStorage and today to ensure update search index once a day.
            return;
        }
        injectScripts(["script/add-search-index.js"]);
    }
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:std") {
        let searchIndex = event.data.message.searchIndex;
        if (TARGET === 'stable') {
            rse.IndexSetter.setStdStableIndex(searchIndex);
        } else {
            rse.IndexSetter.setStdNightlyIndex(searchIndex);
        }
        let now = new Date();
        let version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        localStorage.setItem(`rust-search-extension:${TARGET}`, version);
        console.log(version);
    }
});


// Link issue and since urls in source pages.
function linkSourcePageUrls() {
    for (let span of document.querySelectorAll("span.attribute,span.attr>span.string")) {
        let text = span.textContent;
        if (/^"[0-9]*"$/g.test(text)) {
            // #[unstable(feature = "xxx", issue = "62358")]
            let href = `https://github.com/rust-lang/rust/issues/${text.replace('"', '').trim()}`;
            span.innerHTML = `<a class="rse-link" href="${href}">${text}</a>`;
        }
    }
}