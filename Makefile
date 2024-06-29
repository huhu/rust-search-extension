include core/extension.mk
include build.mk

.PHONY: chrome manage bundle

# Override the included `assert` target.
assert:
	@test -d extension/manage && echo "Assert extension/manage success!\n" || (echo "No extension/manage found!\n Running `make manage`"; make manage)

extension/lib: query.rs/lib
	@echo "extension/lib"
	@rm -rf extension/lib
	@cp -r $< $@

# Build manage css and html
manage: extension/lib
	@mkdir -p extension/manage
	@rm -rf extension/manage/*
	@cp -r query.rs/web/*.js extension/manage/
	@cp -r query.rs/web/vendor extension/manage
	@cp -r query.rs/web/css extension/manage
	cd templates && ./build.sh

bundle:
	@echo "Building extension/content_script_bundle.js..."
	@esbuild content-script-bundle.js --bundle --minify --global-name=rse --target=es2015 --outdir=extension

# Build macro-railroad wasm module and js
macro-railroad: extension/wasm/macro-railroad.wasm extension/script/macro-railroad-wasm.js
