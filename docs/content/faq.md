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
# Permissions

### Why does the extension require reading browser history permission?

The sole permission required by the extension is [tabs](https://developer.chrome.com/extensions/tabs), which gives accessing browser tabs information capability. 
We use this permission to open the search result in the `current tab` or `new tab` for the sole purpose. Feel free to check our [Privacy Policy](/privacy/) for more information. 

### Why does the extension require access to github.com?

Since **v1.1.0**, we add a [new enhancement feature](/#rust-repository-enhancement) for the rust-lang repository's [release page](https://github.com/rust-lang/rust/blob/master/RELEASES.md).
This needs permission to access the single release page, no other page else. See the extension permission declaration file: [line 38](https://github.com/huhu/rust-search-extension/blob/7a0aabd0eada6c615816c3f164647d3059fa4d6f/manifest.jsonnet#L38).



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
