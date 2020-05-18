local manifest = import 'core/manifest.libsonnet';
local icons() = {
  [size]: 'rust.png'
  for size in ['16', '48', '128']
};
local js_files(name, files) = ['%s/%s.js' % [name, file] for file in files];

local json = manifest.new(
  name='Rust Search Extension',
  version='0.10.0',
  keyword='rs',
  description='The ultimate search extension for Rust',
)
             .addIcons(icons())
             .addWebAccessibleResources('script/add-search-index.js')
             .addBackgroundScripts(
  ['settings.js', 'deminifier.js']
)
             .addBackgroundScripts(js_files('search', ['book', 'crate', 'attribute', 'lint']))
             .addBackgroundScripts(js_files('search/docs', ['base', 'std', 'crate-doc']))
             .addBackgroundScripts(js_files('index', ['books', 'crates', 'std-docs', 'lints', 'labels']))
             .addBackgroundScripts(js_files('command', ['label', 'tool', 'book', 'help', 'yet', 'stable']))
             .addBackgroundScripts('main.js')
             .addContentScript(
  matches=['*://docs.rs/*'],
  js=js_files('script', ['lib', 'docs-rs']) + js_files('libs', ['semver']),
  css=['script/docs-rs.css'],
);

if std.extVar('browser') == 'firefox' then
  json
else
  json.appendContentSecurityPolicy(" script-src-elem 'self' https://rust-search-extension.now.sh/crates/index.js;")
  + {
    description: 'A handy browser extension to search Rust docs and crates, etc in the address bar instantly!',
    // The production extension public key to get the constant extension id during development.
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxOX+QfzcFnxPwwmzXDhuU59XGCSMZq+FGo0vOx/ufg/Vw7HfKEPVb9TKzrGtqW38kafWkjxOxGhF7VyyX2ymi55W0xqf8BedePbvMtV6H1tY5bscJ0dLKGH/ZG4T4f645LgvOWOBgyv8s3NDWXzwOMS57ER1y+EtHjDsWD1M0nfe0VCCLW18QlAsNTHfLZk6lUeEeGXZrl6+jK+pZxwhQFmc8cJvOyw7uAq6IJ9lnGDvxFVjGUepA0lKbLuIZjN3p70mgVUIuBYzKE6R8HDk4oBbKAK0HyyKfnuAYbfwVYotHw4def+OW9uADSlZEDC10wwIpU9NoP3szh+vWSnk0QIDAQAB',
  }
