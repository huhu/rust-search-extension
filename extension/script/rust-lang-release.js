document.addEventListener("DOMContentLoaded", async () => {
    // Stick release page h1 title
    let versions = document.querySelectorAll('.markdown-body>h1');
    for (let version of versions) {
        version.style.position = 'sticky';
        version.style.top = "0px";
        version.style.backgroundColor = "#fff";
    }
});