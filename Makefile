.PHONY: chrome

chrome: core
	@jsonnet -J core manifest.jsonnet --ext-str browser=chrome -o extension/manifest.json

edge: core
	@jsonnet -J core manifest.jsonnet --ext-str browser=edge -o extension/manifest.json

firefox: core
	@jsonnet -J core manifest.jsonnet --ext-str browser=firefox -o extension/manifest.json

core: clean
	@cp -R core/src extension/core

clean:
	@rm -rf extension/core manifest.json
