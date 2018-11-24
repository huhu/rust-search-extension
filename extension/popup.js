document.addEventListener('DOMContentLoaded', function() {
    var openTypeSelect = document.querySelector('select[name="open-type"]');
    if (localStorage.getItem("open-type")) {
        openTypeSelect.value = localStorage.getItem("open-type");
        openTypeSelect.selected = true;
    }
    openTypeSelect.onchange = onOpenTypeChange;
}, false);

function onOpenTypeChange(event) {
    localStorage.setItem("open-type", event.target.value);
}