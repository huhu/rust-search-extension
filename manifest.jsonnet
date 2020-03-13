// jsonnet manifest.jsonnet --ext-str browser=chrome|firefox -o extension/manifest.json
local icons() = {
    [size]: "icon.png"
    for size in ["16","48","128"]
};
local js_files(name, files) = ["%s/%s.js" % [name, file] for file in files];
local manifest = {
      manifest_version: 2,
      name: "Rust Search Extension",
      description: "The ultimate search extension for Rust",
      version: "0.8.1",
      icons: icons(),
      browser_action: {
        default_icon: $.icons,
        default_popup: "popup/index.html",
        default_title: $.description,
      },
      content_security_policy: "script-src 'self'; object-src 'self';",
      omnibox: {
        keyword: "rs"
      },
      content_scripts: [{
            matches: [
              "*://docs.rs/*"
            ],
            js: js_files("script", ["docs-rs"]),
            run_at: "document_start"
      }],
      background: {
        scripts: ["compat.js", "settings.js", "deminifier.js",] +
                 js_files("search" ,["book", "doc", "crate", "attribute"]) +
                 js_files("index" ,["books", "crates", "std-docs"]) +
                 js_files("command" ,["base", "history", "manager"]) +
                 ["omnibox.js", "main.js","app.js",]
      },
      permissions: [
        "tabs"
      ],
      appendContentSecurityPolicy(policy)::self + {
            content_security_policy +: policy,
      }
};

if std.extVar("browser") == "firefox" then
  manifest
else
  manifest.appendContentSecurityPolicy(" script-src-elem 'self' https://rust-search-extension.now.sh/crates/index.js;")