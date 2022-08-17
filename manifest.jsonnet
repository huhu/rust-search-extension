// Format: jsonnetfmt -i manifest.jsonnet

local utils = import 'core/utils.libsonnet';

local icons() = {
  [size]: 'assets/rust.png'
  for size in ['16', '48', '128']
};

local name = 'Rust Search Extension';
local version = '1.8.0';
local keyword = 'rs';
local description = 'Rust Search Extension - the ultimate search extension for Rust';

local browser = std.extVar('browser');

local json = if std.member(['chrome', 'edge'], browser) then
  local manifest_v3 = import 'core/manifest_v3.libsonnet';
  manifest_v3.new(name, keyword, description, version, service_worker='service-worker.js')
  .addWebAccessibleResources(
    resources=utils.js_files('script', ['lib', 'add-search-index']),
    matches=['*://docs.rs/*', '*://doc.rust-lang.org/*'],
  ).addWebAccessibleResources(
    resources=['wasm/*.wasm', 'assets/*.svg'],
    matches=[
      '*://docs.rs/*',
      '*://doc.rust-lang.org/*',
    ],
  ) {
    description: 'A handy browser extension to search Rust docs and crates, etc in the address bar instantly!',
    // The production extension public key to get the constant extension id during development.
    [if browser == 'chrome' then 'key' else null]: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOX+QfzcFnxPwwmzXDhuU59XGCSMZq+FGo0vOx/ufg/Vw7HfKEPVb9TKzrGtqW38kafWkjxOxGhF7VyyX2ymi55W0xqf8BedePbvMtV6H1tY5bscJ0dLKGH/ZG4T4f645LgvOWOBgyv8s3NDWXzwOMS57ER1y+EtHjDsWD1M0nfe0VCCLW18QlAsNTHfLZk6lUeEeGXZrl6+jK+pZxwhQFmc8cJvOyw7uAq6IJ9lnGDvxFVjGUepA0lKbLuIZjN3p70mgVUIuBYzKE6R8HDk4oBbKAK0HyyKfnuAYbfwVYotHw4def+OW9uADSlZEDC10wwIpU9NoP3szh+vWSnk0QIDAQAB',
  }
else
  local manifest_v2 = import 'core/manifest.libsonnet';
  manifest_v2.new(name, keyword, description, version)
  .addWebAccessibleResources(utils.js_files('script', ['lib', 'add-search-index']))
  .addWebAccessibleResources(['wasm/*.wasm', 'assets/*.svg'])
  .addBackgroundScripts(['migration.js', 'settings.js', 'deminifier.js'])
  .addBackgroundScripts(utils.js_files('search', ['algorithm', 'book', 'crate', 'attribute', 'caniuse', 'lint']))
  .addBackgroundScripts(utils.js_files('search/docs', ['base', 'crate-doc', 'rustc']))
  .addBackgroundScripts(utils.js_files('index', ['attributes', 'books', 'caniuse', 'crates', 'std-docs', 'lints', 'labels', 'rfcs', 'commands']))
  .addBackgroundScripts(utils.js_files('command', ['blog', 'label', 'help', 'stable', 'rfc']))
  .addBackgroundScripts(['statistics.js', 'rust-version.js', 'crate-manager.js', 'index-manager.js', 'main.js'])
;

json.addIcons(icons())
.addPermissions(['storage', 'unlimitedStorage'])
.setOptionsUi('manage/index.html')
.addContentScript(
  matches=['*://docs.rs/*'],
  js=utils.js_files('script', ['lib', 'docs-rs', 'svgs', 'rust-src-navigate']) + utils.js_files('libs', ['semver']),
  css=['script/docs-rs.css', 'script/details-toggle.css'],
)
.addContentScript(
  matches=['*://doc.rust-lang.org/*'],
  js=utils.js_files('script', ['lib', 'doc-rust-lang-org', 'rust-src-navigate']),
  css=['script/doc-rust-lang-org.css', 'script/details-toggle.css'],
  exclude_matches=['*://doc.rust-lang.org/nightly/nightly-rustc/*'],
)
.addContentScript(
  matches=['*://doc.rust-lang.org/nightly/nightly-rustc/*'],
  js=utils.js_files('script', ['lib', 'rustc', 'rust-src-navigate']),
  css=['script/details-toggle.css'],
)
.addContentScript(
  matches=['*://rust.extension.sh/update'],
  js=utils.js_files('script', ['rust-extension-sh']),
  css=[],
).addContentScript(
  matches=['*://github.com/rust-lang/rust/blob/master/RELEASES.md*'],
  js=utils.js_files('script', ['lib', 'rust-lang-release']),
  css=['script/github.css'],
).addContentScript(
  matches=[
    '*://docs.rs/*',
    '*://doc.rust-lang.org/*',
  ],
  js=['core/storage.js', 'settings.js'] + utils.js_files('script', ['lib', 'macro-railroad', 'macro-railroad-wasm']),
  css=['script/macro-railroad.css'],
)
