+++
title = "FAQ"
description = "Frequently asked questions"
weight = 2
+++

# Platform

### Any plans on support Safari?

Unfortunately, no. According to MDN's web extension [compatibility chart](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs#omnibox):
Safari doesn't support omnibox API, which is essential to this extension. See issue [#87](https://github.com/huhu/rust-search-extension/issues/87).

# Permissions

### Why the extension requires read browsing history permission?

The sole permission required by the extension is [tabs](https://developer.chrome.com/extensions/tabs), which gives accessing browser tabs information capability. 
We use this permission to open the search result in the `current tab` or `new tab` for the sole purpose. Feel free to check our [Privacy Policy](/privacy/) for more information. 

### Why the extension requires access to github.com?

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
$ python -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Then set `http://0.0.0.0:8000` as your local doc path.
