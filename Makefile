include core/extension.mk

.PHONY: chrome manage

# Override the included `assert` target.
assert:
	@test -d extension/manage && echo "Assert extension/manage success!\n" || (echo "No extension/manage found!\n Running `make manage`"; make manage)

# Build manage pages
manage:
	@cd manage && cargo run
