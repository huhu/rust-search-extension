function Toast(selector) {
    this.element = document.querySelector(selector);
    this.dismissTimeoutId = null;
    this.element.addEventListener("mouseover", () => {
        if (this.dismissTimeoutId) {
            clearTimeout(this.dismissTimeoutId);
        }
    });
    this.element.addEventListener("mouseleave", () => {
        this.dismiss();
    });
}

Toast.prototype.info = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#fbeca0dd";
    this.element.textContent = message;
};

Toast.prototype.success = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#357911dd";
    this.element.textContent = message;
};

Toast.prototype.error = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#ff0000dd";
    this.element.textContent = message;
};

Toast.prototype.dismiss = function(delay = 2000) {
    this.dismissTimeoutId = setTimeout(() => this.element.style.display = "none", delay);
};