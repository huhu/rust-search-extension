local manifest = import 'core/manifest.libsonnet';
local utils = import 'core/utils.libsonnet';

local icons() = {
  [size]: 'rust.png'
  for size in ['16', '48', '128']
};

local json = manifest.new(
  name='Rust Search Extension',
  version='0.11.0',
  keyword='rs',
  description='The ultimate search extension for Rust',
)
             .addIcons(icons())
             .addWebAccessibleResources(['script/add-search-index.js', 'script/add-std-search-index.js'])
             .addBackgroundScripts(
  ['settings.js', 'deminifier.js']
)
             .addBackgroundScripts(utils.js_files('search', ['book', 'crate', 'attribute', 'caniuse', 'lint']))
             .addBackgroundScripts(utils.js_files('search/docs', ['base', 'std', 'crate-doc']))
             .addBackgroundScripts(utils.js_files('index', ['attributes', 'books', 'caniuse', 'crates', 'std-docs', 'lints', 'labels', 'commands']))
             .addBackgroundScripts(utils.js_files('command', ['label', 'help', 'stable', 'update']))
             .addBackgroundScripts(['index-manager.js', 'main.js'])
             .addContentScript(
  matches=['*://docs.rs/*'],
  js=utils.js_files('script', ['lib', 'docs-rs', 'svgs']) + utils.js_files('libs', ['semver']),
  css=['script/docs-rs.css'],
)
             .addContentScript(
  matches=['*://doc.rust-lang.org/nightly/std/*'],
  js=utils.js_files('script', ['lib', 'doc-rust-lang-org']),
  css=[],
).addContentScript(
  matches=['*://doc.rust-lang.org/std/*', '*://doc.rust-lang.org/stable/std/*'],
  js=utils.js_files('script', ['lib', 'doc-rust-lang-org']),
  css=[],
).addContentScript(
   matches=["*://rust.extension.sh/update", "*://extension.sh/update/"],
   js=utils.js_files('script', ['rust-extension-sh']),
   css=[],
 );

local browser = std.extVar('browser');
if browser == 'firefox' then
  json
else
  json.appendContentSecurityPolicy(" script-src-elem 'self' https://rust.extension.sh/crates/index.js;")
  +
  if browser == 'chrome' then
    {
      description: 'A handy browser extension to search Rust docs and crates, etc in the address bar instantly!',
      // The production extension public key to get the constant extension id during development.
      key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOX+QfzcFnxPwwmzXDhuU59XGCSMZq+FGo0vOx/ufg/Vw7HfKEPVb9TKzrGtqW38kafWkjxOxGhF7VyyX2ymi55W0xqf8BedePbvMtV6H1tY5bscJ0dLKGH/ZG4T4f645LgvOWOBgyv8s3NDWXzwOMS57ER1y+EtHjDsWD1M0nfe0VCCLW18QlAsNTHfLZk6lUeEeGXZrl6+jK+pZxwhQFmc8cJvOyw7uAq6IJ9lnGDvxFVjGUepA0lKbLuIZjN3p70mgVUIuBYzKE6R8HDk4oBbKAK0HyyKfnuAYbfwVYotHw4def+OW9uADSlZEDC10wwIpU9NoP3szh+vWSnk0QIDAQAB',
    }
  else {}
