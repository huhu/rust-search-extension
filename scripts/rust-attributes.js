// https://doc.rust-lang.org/reference/attributes.html
// https://doc.rust-lang.org/nightly/reference/attributes.html
const attributeMap = {
    doc: [
        "- Specifies documentation.",
        "https://doc.rust-lang.org/rustdoc/the-doc-attribute.html",
    ],
    features: [
        "- Used to enable unstable or experimental compiler features.",
        "https://doc.rust-lang.org/unstable-book/index.html",
    ],
};
let attributeIndex = document.querySelectorAll("main>ul:last-child>li");
for (let node of attributeIndex) {
    let title = node.firstChild;
    if (["documentation", "features"].includes(title.textContent.toLowerCase().trim()))
        continue;
    let attributes = node.lastElementChild.querySelectorAll("ul>li");
    attributes.forEach(attribute => {
        let description = "";

        attribute.childNodes.forEach(childNode => {
            if (childNode.nodeName !== "A" && childNode.textContent.trim().length > 1) {
                description += childNode.textContent;
            }
        });
        attribute.querySelectorAll("a").forEach(a => {
            attributeMap[a.firstChild.textContent] = [description.trim(), a.getAttribute("href")];
        });
    });
}

console.log(JSON.stringify(attributeMap));