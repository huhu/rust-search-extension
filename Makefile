include core/extension.mk
include build.mk

.PHONY: chrome manage

# Override the included `assert` target.
assert:
	@test -d extension/manage && echo "Assert extension/manage success!\n" || (echo "No extension/manage found!\n Running `make manage`"; make manage)

# Build manage css and html
manage:
	@cd manage && cargo run

# Build macro-railroad wasm module and js
macro-railroad: extension/script/macro-railroad-wasm.js extension/wasm/macro-railroad.wasm
