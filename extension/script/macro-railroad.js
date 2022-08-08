document.addEventListener("DOMContentLoaded", async () => {
    await load();
});

async function load() {
    if (!isRustDoc()) return;

    let macros = document.querySelectorAll('pre.macro');
    if (!macros || macros.length === 0) return;

    await wasm_bindgen(chrome.runtime.getURL('wasm/macro-railroad.wasm'));
    injectCss();

    for (let macro of macros) {
        let parentNode = macro.parentNode;
        if (!parentNode) continue;

        const macroSrc = macro.innerText;
        // The div that the `pre.macro` get's moved into, together with the new diagram nodes
        let newNode = document.createElement('div');
        newNode.setAttribute('style', 'width: 100%;');
        // The container which holds the inline-svg on the page
        let svgContainer = document.createElement('div');
        svgContainer.setAttribute('class', 'railroad_container');
        svgContainer.appendChild(document.createElement('svg'));
        // Append svg container ahead macro element to prevent noisy overflow.
        newNode.appendChild(svgContainer);
        newNode.appendChild(macro);

        let modalContainer = createModal();
        newNode.appendChild(modalContainer);

        const diagramOptions = new wasm_bindgen.DiagramOptions();
        let iconsContainer = createIcons(macroSrc, diagramOptions);
        svgContainer.appendChild(iconsContainer);

        parentNode.appendChild(newNode);
        updateDiagram(macroSrc, diagramOptions);
    }
}

// Returns `true` if the document's generator is "rustdoc"
function isRustDoc() {
    let gen = document.querySelector('head > meta[name="generator"]');
    return gen && gen.getAttribute('content') === 'rustdoc';
}

// Injects the relevant CSS into the document's <head>
function injectCss() {
    let head = document.head;

    let rrCss = document.createElement('style');
    rrCss.setAttribute('type', 'text/css');
    rrCss.textContent = wasm_bindgen.getRailroadDefaultCss();
    head.appendChild(rrCss);

    let mrrCss = document.createElement('style');
    mrrCss.setAttribute('type', 'text/css');
    mrrCss.textContent = wasm_bindgen.getRailroadDigramCss();
    head.appendChild(mrrCss);
}

// The modal to go fullscreen
function createModal() {
    let modalContent = document.createElement('div');
    modalContent.appendChild(document.createElement('svg'));
    modalContent.setAttribute('class', 'railroad_modal_content');

    let modalContainer = document.createElement('div');
    modalContainer.appendChild(modalContent);
    modalContainer.setAttribute('class', 'railroad_modal');
    modalContainer.onclick = function () {
        modalContainer.classList.remove('railroad_active');
    };

    return modalContainer;
}

// The icons in the lower-right corner, including the options-dialog
function createIcons(macroSrc, diagramOptions) {
    // The icons in the bottom-right corner
    let iconsContainer = document.createElement('div');
    iconsContainer.setAttribute('class', 'railroad_icons');

    // The options-thingy and the options
    let optionsContainer = document.createElement('div');
    optionsContainer.setAttribute('style', 'position: relative; display: inline');

    // The container that holds the options-list
    let dropdownContainer = document.createElement('div');
    dropdownContainer.setAttribute('style', 'position: absolute');
    dropdownContainer.setAttribute('class', 'railroad_dropdown_content');

    let optionsList = document.createElement('ul');
    optionsList.setAttribute('style', 'list-style-type: none; padding: 0px; margin: 0px');

    const createOption = function (key, label) {
        let listItem = document.createElement('li');
        let inputItem = document.createElement('input');
        inputItem.setAttribute('type', 'checkbox');
        // Generate random id for inputItem
        let randomId = Array.from(Array(8), () => Math.floor(Math.random() * 36).toString(36)).join('');
        let inputItemId = `railroad_${randomId}`;
        inputItem.setAttribute('id', inputItemId);
        inputItem.setAttribute('checked', diagramOptions[key]);
        inputItem.onchange = () => {
            diagramOptions[key] = inputItem.checked;
            updateDiagram(macroSrc, diagramOptions);
        };

        listItem.appendChild(inputItem);

        let labelItem = document.createElement('label');
        labelItem.setAttribute('style', 'padding-left: 8px');
        labelItem.setAttribute('for', inputItemId);
        labelItem.textContent = label;
        listItem.appendChild(labelItem);

        return listItem;
    };
    optionsList.appendChild(createOption('hideInternal', 'Hide macro-internal rules'));
    optionsList.appendChild(createOption('keepGroups', 'Keep groups bound'));
    optionsList.appendChild(createOption('foldCommonTails', 'Fold common sections'));
    optionsList.appendChild(createOption('showLegend', 'Generate legend'));

    dropdownContainer.appendChild(optionsList);

    let optionsIcon = document.createElement('img');
    optionsIcon.setAttribute('class', 'railroad_icon');
    optionsIcon.setAttribute('src', chrome.runtime.getURL('assets/options.svg'));
    optionsIcon.onclick = function () {
        dropdownContainer.classList.toggle('railroad_dropdown_show');
    };
    optionsContainer.appendChild(optionsIcon);
    optionsContainer.appendChild(dropdownContainer);
    iconsContainer.appendChild(optionsContainer);

    // The fullscreen-toggle
    let fullscreenIcon = document.createElement('img');
    fullscreenIcon.setAttribute('class', 'railroad_icon');
    fullscreenIcon.setAttribute('src', chrome.runtime.getURL('assets/fullscreen.svg'));
    fullscreenIcon.onclick = function () {
        let modalContainer = document.querySelector('.railroad_modal');
        modalContainer.classList.add('railroad_active');
    };
    iconsContainer.appendChild(fullscreenIcon);
    return iconsContainer;
}

// The update function, called when options are set and to create the initial diagram
function updateDiagram(macroSrc, diagramOptions) {
    let diagram = wasm_bindgen.toDiagram(macroSrc, diagramOptions);
    let svgContainer = document.querySelector('div.railroad_container');
    let modalContent = document.querySelector('div.railroad_modal_content');
    svgContainer.replaceChild(htmlToElement(diagram.svg), svgContainer.firstChild);
    svgContainer.setAttribute('style', `max-width: ${diagram.width}px`);
    modalContent.replaceChild(htmlToElement(diagram.svg), modalContent.firstChild);
}

// Convert plain HTML text to element
function htmlToElement(html) {
    let div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild
}