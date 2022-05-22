// Migrate data from locaStorage to chrome.storage API.
//
// This migrations is required because Chrome Manifest V3 change background script to service worker,
// however, service worker doesn't support localStorage API. Therefore, we should migrate those data to
// chrome.storage before we upgrade to Manifest V3. Otherwise, we cann't do such a migrations, because we
// cannot access to localStorage API in service worker any more.
async function migrate() {
    // If localStorage API unavailable means we are in Manifest V3,
    // we cannot do this migrations.
    if (!localStorage) {
        console.error('localStorage doesn\'t support');
        return;
    }

    console.log('starting migration...');
    // Migrate all keys.
    const keys = ['history', 'statistics', 'crates', 'auto-update', 'auto-update-version', 'offline-mode', 'offline-path', 'crate-registry', 'default-search'];
    for (let key of keys) {
        await migrateLocalStorage(key);
    }

    // Migrate all search index of crates.
    let crates = JSON.parse(localStorage.getItem('crates') || '{}');
    for (let crate in crates) {
        await migrateLocalStorage(`@${crate}`);
    }
    console.log('migrate finised');
}