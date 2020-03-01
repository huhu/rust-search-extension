.PHONY: manifest

manifest:
	@jsonnet $@.jsonnet --ext-str browser=$(browser) -o extension/$@.json
