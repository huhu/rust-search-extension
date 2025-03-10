// Format: jsonnetfmt -i manifest.jsonnet

local manifest_v3 = import 'core/manifest_v3.libsonnet';
local utils = import 'core/utils.libsonnet';

local icons() = {
  [size]: 'assets/rust.png'
  for size in ['16', '48', '128']
};

local name = 'Rust Search Extension';
local version = '2.0.2';
local keyword = 'rs';
local description = 'Rust Search Extension - the ultimate search extension for Rust';

local browser = std.extVar('browser');

local host_permissions = ['*://crates.io/api/v1/crates/*', 'https://rust.extension.sh/*'];
local optional_host_permissions = ['file:///*'];
local json = if std.member(['chrome', 'edge'], browser) then
  manifest_v3.new(name, keyword, description, version, service_worker='service-worker.js')
else
  // Firefox does not support service worker yet.
  manifest_v3.new(name, keyword, description, version, background_page='firefox-bg.html') { browser_specific_settings: {
    // Firefox need extension id to be set in the manifest.
    // https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/
    gecko: {
      id: '{04188724-64d3-497b-a4fd-7caffe6eab29}',
      strict_min_version: '109.0',
    },
  } }
;

json
.addWebAccessibleResources(
  resources=['script/*.js', 'wasm/*.wasm', 'assets/*.svg'],
  matches=[
    '*://docs.rs/*',
    '*://doc.rust-lang.org/*',
  ],
) {
  description: 'A handy browser extension to search Rust docs and crates, etc in the address bar instantly!',
  // The production extension public key to get the constant extension id during development.
  [if browser == 'chrome' then 'key' else null]: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOX+QfzcFnxPwwmzXDhuU59XGCSMZq+FGo0vOx/ufg/Vw7HfKEPVb9TKzrGtqW38kafWkjxOxGhF7VyyX2ymi55W0xqf8BedePbvMtV6H1tY5bscJ0dLKGH/ZG4T4f645LgvOWOBgyv8s3NDWXzwOMS57ER1y+EtHjDsWD1M0nfe0VCCLW18QlAsNTHfLZk6lUeEeGXZrl6+jK+pZxwhQFmc8cJvOyw7uAq6IJ9lnGDvxFVjGUepA0lKbLuIZjN3p70mgVUIuBYzKE6R8HDk4oBbKAK0HyyKfnuAYbfwVYotHw4def+OW9uADSlZEDC10wwIpU9NoP3szh+vWSnk0QIDAQAB',
}
.addHostPermissions(host_permissions)
.addOptionalHostPermissions(optional_host_permissions)
.addIcons(icons())
.addPermissions(['storage', 'unlimitedStorage', 'alarms'])
.setOptionsUi('manage/index.html')
.addContentScript(
  matches=['*://docs.rs/*'],
  js=['content-script-bundle.js'] + utils.js_files('script', ['lib', 'docs-rs', 'rust-src-navigate', 'semver']),
  css=['script/docs-rs.css', 'script/details-toggle.css'],
)
.addContentScript(
  matches=['*://doc.rust-lang.org/*'],
  js=['content-script-bundle.js'] + utils.js_files('script', ['lib', 'doc-rust-lang-org', 'rust-src-navigate']),
  css=['script/doc-rust-lang-org.css', 'script/details-toggle.css'],
  exclude_matches=['*://doc.rust-lang.org/nightly/nightly-rustc/*'],
)
.addContentScript(
  matches=['*://rust.extension.sh/update'],
  js=['content-script-bundle.js'] + utils.js_files('script', ['rust-extension-sh']),
  css=[],
).addContentScript(
  matches=[
    '*://docs.rs/*',
    '*://doc.rust-lang.org/*',
  ],
  js=['content-script-bundle.js'] + utils.js_files('script', ['lib', 'macro-railroad', 'macro-railroad-wasm']),
  css=['script/macro-railroad.css'],
)
