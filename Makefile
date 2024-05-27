include core/extension.mk
include build.mk

.PHONY: chrome manage bundle

# Override the included `assert` target.
assert:
	@test -d extension/manage && echo "Assert extension/manage success!\n" || (echo "No extension/manage found!\n Running `make manage`"; make manage)

# Build manage css and html
manage:
	@cd manage && cargo run

bundle:
	@echo "Building extension/content_script_bundle.js..."
	@esbuild content-script-bundle.js --bundle --minify --global-name=rse --target=es2015 --outdir=extension

# Build macro-railroad wasm module and js
macro-railroad: extension/wasm/macro-railroad.wasm extension/script/macro-railroad-wasm.js
