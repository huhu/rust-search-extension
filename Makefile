.PHONY: chrome

chrome: clean
	@jsonnet -J core manifest.jsonnet --ext-str browser=chrome -o extension/manifest.json
	@cp -R core/src extension/core

firefox: clean
	@jsonnet -J core manifest.jsonnet --ext-str browser=firefox -o extension/manifest.json
	@cp -R core/src extension/core

books-index:
	RUST_BACKTRACE=full cargo run --bin books-index --features books-index --manifest-path=rust/Cargo.toml extension/index/books.js

crates-index:
	RUST_BACKTRACE=full cargo run --bin crates-index --features crates-index --manifest-path=rust/Cargo.toml /tmp/db-dump.tar.gz extension/index/crates.js

lints-index:
	RUST_BACKTRACE=full cargo run --bin lints-index --features books-index --manifest-path=rust/Cargo.toml extension/index/lints.js

labels-index:
	RUST_BACKTRACE=full cargo run --bin labels-index --features labels-index --manifest-path=rust/Cargo.toml extension/index/labels.js

clean:
	@rm -rf extension/core manifest.json
