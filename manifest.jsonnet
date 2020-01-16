// jsonnet manifest.jsonnet --ext-str browser=chrome|firefox -o extension/manifest.json
local manifest = {
      manifest_version: 2,
      name: "Rust Search Extension",
      description: "A handy browser extension to search crates and official docs in the address bar (omnibox)",
      version: "0.6",
      icons: {
        "16": "icon.png",
        "48": "icon.png",
        "128": "icon.png"
      },
      browser_action: {
        "default_icon": {
          "16": "icon.png",
          "48": "icon.png",
          "128": "icon.png"
        },
        default_popup: "popup.html",
        default_title: "A handy browser extension to search crates and official docs in the address bar (omnibox)"
      },
      content_security_policy: "script-src 'self'; object-src 'self';",
      omnibox: {
        "keyword": "rs"
      },
      background: {
        scripts: [
          "settings.js",
          "search.js",
          "search-index.js",
          "deminifier.js",
          "crate-search.js",
          "crates-index.js",
          "omnibox.js",
          "main.js"
        ]
      },
      permissions: [
        "tabs"
      ],
      appendContentSecurityPolicy(policy)::self + {
            content_security_policy +: policy,
      }
};


if std.extVar("browser") == "chrome" then
  manifest.appendContentSecurityPolicy(" script-src-elem 'self' https://rust-search-extension.now.sh/crates/crates-index.js;")
else manifest