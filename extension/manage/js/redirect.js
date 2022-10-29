(async() => {
    let crate = location.search.slice(1).split("=")[1];
    try {
        let response = await fetch(`https://crates.io/api/v1/crates/${crate}`, { mode: "cors" });
        let loading = document.querySelector(".loading");
        if (response.status === 200) {
            let json = await response.json();

            if (json.crate.repository) {
                loading.innerHTML = `Obtained the repository url of <b>${crate}</b>. 
                <span style="vertical-align:sub"><img class="animate__animated animate__fadeIn" src="../assets/check.svg" style="padding-left:10px"/></span>`;
                loading.insertAdjacentHTML("beforeend", '<div class="heading-text redirect animate__animated animate__fadeIn">Redirecting...</div>');
                location = json.crate.repository;
            } else {
                loading.innerHTML = `<div>
                    <p>Sorry, the crate <b>${crate}</b> has no repository url. <span style="vertical-align:sub"><img class="animate__animated animate__fadeIn" src="../assets/error.svg" style="padding-left:10px"/></span></p>
                    <h2 class="redirect">Go to <a href="https://crates.io/crates/${crate}">crates.io/crates/${crate}</a> or <a href="https://docs.rs/${crate}">docs.rs/${crate}</a></h2>
                    </div>`;
            }
        } else {
            requestFailed();
        }
    } catch (e) {
        requestFailed();
    }
})();

function requestFailed() {
    let loading = document.querySelector(".loading");
    loading.innerHTML = `Request failed, please try again :(`;
}