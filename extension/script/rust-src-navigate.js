document.addEventListener("DOMContentLoaded", () => {
    // https://doc.rust-lang.org/std/option/enum.Option.html?mode=src will redirect to
    // https://doc.rust-lang.org/src/core/option.rs.html#161-170
    let currentUrl = new URL(location.href);
    if (currentUrl.searchParams.get("mode") === "src") {
        let element = document.getElementById(currentUrl.hash.replace("#", ""))
            || document.querySelector(".fqn");
        if (element) {
            let srclink = element.querySelector(".srclink");
            location.href = srclink.href;
        }
    }
});