const TARGET = location.pathname.includes("/nightly/") ? "nightly" : "stable";

document.addEventListener("DOMContentLoaded", async () => {
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
        const key = `rust-search-extension:${TARGET}`;
        const version = getRustdocVar("rustdoc-version") || new Date().toDateString();
        if (localStorage.getItem(key) === version) return;

        try {
            const { searchIndex, descShards } = await importRustdocIndex();
            await rse.IndexSetter.setStdDocIndex(TARGET, searchIndex, descShards);
            localStorage.setItem(key, version);
        } catch (error) {
            console.error("Could not update the Rustdoc search index:", error);
        }
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
