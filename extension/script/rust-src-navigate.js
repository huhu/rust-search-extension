document.addEventListener("DOMContentLoaded", () => {
    // https://doc.rust-lang.org/std/option/enum.Option.html?mode=src will redirect to
    // https://doc.rust-lang.org/src/core/option.rs.html#161-170
    let currentUrl = new URL(location.href);
    if (currentUrl.searchParams.get("mode") === "src") {
        // Special case:
        // We can not redirect https://doc.rust-lang.org/std/option/enum.Option.html#variant.Some
        // to the corresponding lines of variant Some, since the docs has no "srclink" for variant.
        // We fallback to the "srclink" of Option.
        let hash = currentUrl.hash.replace(/#(variant\.)?/i, "");
        let element = document.getElementById(hash)
            || document.querySelector(".out-of-band");

        if (element) {
            let srclink = element.querySelector(".srclink,.src");
            location.href = srclink.href;
        }
    }
});