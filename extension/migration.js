// This migration is required because Chrome Manifest V3 changes the background script
// to the service worker, however, the service worker doesn't support localStorage API.
// Therefore, we should migrate those data to chrome.storage before we upgrade to Manifest V3.
// Otherwise, we can't do such a migration, because we cannot access localStorage API
// in the service worker anymore.
async function migrate() {
    // If localStorage API unavailable means we are in Manifest V3,
    // we cannot do this migrations.
    if (!localStorage) {
        console.error('localStorage doesn\'t support');
        return;
    }

    // Don't re-migrate.
    if (await storage.getItem('migrate-result')) {
        console.log('Already migrated.');
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

    await storage.setItem('migrate-result', true);
    console.log('migrate finised');
}