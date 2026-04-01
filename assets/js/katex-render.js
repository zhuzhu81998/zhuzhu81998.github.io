function replaceEscapedDollarText(root) {
    root.normalize();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();

    while (textNode) {
        if (textNode.nodeValue && textNode.nodeValue.includes("\\$")) {
            textNode.nodeValue = textNode.nodeValue.replace(/\\\$/g, "$");
        }
        textNode = walker.nextNode();
    }
}

function getKatexScopes() {
    const scopes = Array.from(document.querySelectorAll(".article-content"));
    return scopes.length ? scopes : [document.body];
}

document.getElementById("katex-render") &&
    document.getElementById("katex-render").addEventListener("load", () => {
        getKatexScopes().forEach((scope) => {
            renderMathInElement(scope, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
            replaceEscapedDollarText(scope);
        });
    });
