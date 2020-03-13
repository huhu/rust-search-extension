function Compat() {
    this.isChrome = navigator.userAgent.toLowerCase().indexOf("chrome") !== -1;
    this.browser = this.isChrome ? window.chrome : window.browser;

    // Firefox doesn't support tags in search suggestion.
    this.tagged = this.isChrome ?
        (tag, str) => `<${tag}>${str}</${tag}>` :
        (_, str) => str;
    this.match = (str) => this.tagged("match", str);
    this.dim = (str) => this.tagged("dim", str);
}

// Escape the five predefined entities to display them as text.
Compat.prototype.escape = function(str) {
    str = str || "";
    return this.isChrome ? str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
        : str;
};

// Compatibly get extension's background page.
Compat.prototype.getBackgroundPage = function() {
    return this.browser.extension.getBackgroundPage();
};

Compat.prototype.normalizeDate = function(date) {
    let month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();
    return [year, month.padStart(2, "0"), day.padStart(2, "0")].join('-');
};

Compat.prototype.sendMessage = function(message, response) {
    c.browser.runtime.sendMessage(message, response);
};