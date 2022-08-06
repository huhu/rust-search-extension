include core/extension.mk

.PHONY: chrome manage

# Override the included `assert` target.
assert:
	@test -d extension/manage && echo "Assert extension/manage success!\n" || (echo "No extension/manage found!\n Running `make manage`"; make manage)

# Build manage pages
manage:
	@cd manage && cargo run

macro-railroad: extension/script/macro-railroad-wasm.js extension/wasm/macro-railroad.wasm

extension/script/macro-railroad-wasm.js: macro-railroad/pkg/macro-railroad.js
	cp $< $@

extension/wasm/macro-railroad.wasm: macro-railroad/pkg/macro-railroad.wasm
	cp $< $@

macro-railroad/pkg/macro-railroad.wasm: macro-railroad/Cargo.lock macro-railroad/Cargo.toml macro-railroad/build.rs macro-railroad/src/lib.rs
	cd macro-railroad && wasm-pack build -t no-modules --out-name macro-railroad && mv pkg/macro-railroad_bg.wasm pkg/macro-railroad.wasm