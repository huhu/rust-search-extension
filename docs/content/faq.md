+++
title = "FAQ"
description = "Frequently asked questions"
weight = 2
+++

# General

### Any plans to support Safari?

Unfortunately, no. According to MDN's web extension [compatibility chart](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs#omnibox):
Safari doesn't support omnibox API, which is essential to this extension. See issue {{ issue(id=87) }}.

### Is it possible to customize the number of suggestions shown in address bar?

The number of suggestions is limited to the browser API, currently we can't customize it. Also, each browser have [a different limit number](https://github.com/huhu/search-extension-core/blob/7629fe7a5f896abf630a2b7dc00e9e6141c36c5c/src/compat.js#L18).

### Is it possible to modify the plugin keyword trigger? For example, can I trigger with `r + tab` instead of `rs + tab`?

Unfortunately, the browser's API doesn't allow the extension to change its keyword dynamically. You can customize your keyword by changing [this line](https://github.com/huhu/rust-search-extension/blob/599b1c9a312751e3cfeef02e5f39d393aa091ba3/manifest.jsonnet#L12) to build your own version.

# Caveats

### Why local `file:` rust doc not work properly on Firefox?

For security reasons, in Firefox, `file:` URLs is an unprivileged URL, accessing to those unprivileged URLs are prohibited.
See the [MDN documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create) for more detail.

### Any workaround to support offline mode on Firefox?

Sure. A good choice is use http server! For example using python **http.server** module:

```sh
$ cd your-rust-doc-directory
$ python3 -m http.server --bind 127.0.0.1
Serving HTTP on 127.0.0.1 port 8000 (http://127.0.0.1:8000/) ...
```

Then set `http://127.0.0.1:8000` as your local doc path.
