.PHONY: extension/lib

extension/lib: query.rs/web/lib
	@rm -rf extension/lib
	@cp -r $< $@


extension/script/macro-railroad-wasm.js: macro-railroad/pkg/macro-railroad.js
	cp $< $@

extension/wasm/macro-railroad.wasm: macro-railroad/pkg/macro-railroad.wasm
	cp $< $@

macro-railroad/pkg:
	mkdir $@

macro-railroad/pkg/macro-railroad.wasm: macro-railroad/Cargo.lock macro-railroad/Cargo.toml macro-railroad/build.rs macro-railroad/src/lib.rs | macro-railroad/pkg
	cd macro-railroad && wasm-pack build -t no-modules --no-typescript --out-name macro-railroad && cp pkg/macro-railroad_bg.wasm pkg/macro-railroad.wasm