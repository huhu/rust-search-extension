+++
title = "FAQ"
description = "Frequently asked questions"
weight = 2
+++

# Permissions

### Why the extension requires read browsing history permission?

The sole permission required by the extension is [tabs](https://developer.chrome.com/extensions/tabs), which gives accessing browser tabs information capability. 
We use this permission to open the search result in the `current tab` or `new tab` for the sole purpose. Feel feel to check our [Privacy Policy](/privacy/) for more information. 

# Caveats

### Why local `file:` rust doc not work properly on Firefox?

For security reasons, in Firefox, `file:` URLs is an unprivileged URL, accessing to those unprivileged URLs are prohibited. 
See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create) for more detail.

### Any workaround to support offline mode on Firefox?

Sure. A good choice is use http server! For example using python **http.server** module:

```sh
$ cd your-rust-doc-directory
$ python -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Then set `http://0.0.0.0:8000` as your local doc path.

### Sync the latest crates index on popup page doesn't work on some browser?

This feature relies on the browser's `script-src-elem` [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy), 
which not supported on some browser (such as Firefox, Edge). 
See [Mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-elem).
