/**
 * This is a hack to keep the service worker running forever on Firefox, which
 * aggressively shuts down the worker on Manifest v3 (resulting in a poor search experience).
 *
 * It may be possible to fine-tune the event registration so this isn't necessary,
 * but it seems like even re-initializing for omnibox.onInputStarted isn't enough to
 * get suggestions working how they used to in manifest v2.
 *
 * See <https://bugzilla.mozilla.org/show_bug.cgi?id=1771203> for more info.
 **/
browser.alarms.onAlarm.addListener(() => {
    // This handler doesn't need to do anything, merely exist.
});

// Default idle timeout is 30s, this alarm will fire every 20s
browser.alarms.create("keepalive", { periodInMinutes: 1.0 / 3.0 });
