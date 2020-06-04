.PHONY: chrome

chrome: clean
	@jsonnet -J core manifest.jsonnet --ext-str browser=chrome -o extension/manifest.json
	@cp -R core/src extension/core

firefox: clean
	@jsonnet -J core manifest.jsonnet --ext-str browser=firefox -o extension/manifest.json
	@cp -R core/src extension/core

clean:
	@rm -rf extension/core manifest.json
