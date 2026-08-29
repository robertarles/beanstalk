.DEFAULT_GOAL := help
.PHONY: help all clean build test coverage report-index install

# ── Report locations (generated; gitignored — see CONTRIBUTING.md) ────────────
REPORTS       := reports
TEST_REPORTS  := $(REPORTS)/testing
COV_REPORTS   := $(REPORTS)/coverage

# Coverage tooling prerequisites:
#   Frontend: @vitest/coverage-v8 (devDependency)
#   Rust:     cargo-nextest, cargo-llvm-cov, llvm-tools-preview
#             cargo install cargo-nextest cargo-llvm-cov
#             rustup component add llvm-tools-preview

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

all: build test coverage report-index ## Build everything (default build pipeline)

clean: ## Remove build artifacts and generated reports
	rm -rf dist $(REPORTS)
	cd src-tauri && cargo clean

build: clean ## Build frontend + Rust release bundle
	npm run build
	cd src-tauri && cargo build --release

test: ## Run all tests; emit JUnit XML to reports/testing/ (fails on any failure)
	@mkdir -p $(TEST_REPORTS)
	VITEST_JUNIT=1 npm test
	cd src-tauri && cargo nextest run --profile ci
	cp src-tauri/target/nextest/ci/junit.xml $(TEST_REPORTS)/rust.junit.xml

coverage: ## Run tests with coverage; emit lcov to reports/coverage/; fail under 90%
	@mkdir -p $(COV_REPORTS)/rust
	npm test -- --coverage
	cd src-tauri && cargo llvm-cov --no-report
	cd src-tauri && cargo llvm-cov report --lcov --output-path ../$(COV_REPORTS)/rust/lcov.info
	cd src-tauri && cargo llvm-cov report --html --output-dir ../$(COV_REPORTS)/rust
	cd src-tauri && cargo llvm-cov report --fail-under-lines 90 --fail-under-regions 90
	@$(MAKE) --no-print-directory report-index

report-index: ## Generate reports/index.html linking the HTML reports
	@mkdir -p $(REPORTS)
	@printf '%s\n' \
		'<!doctype html><html lang="en"><head><meta charset="utf-8">' \
		'<title>Beanstalk — Test &amp; Coverage Reports</title>' \
		'<style>body{font:15px/1.5 system-ui,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1rem;color:#1f2937}h1{font-size:1.4rem}li{margin:.4rem 0}code{background:#f3f4f6;padding:.1rem .3rem;border-radius:.2rem}</style>' \
		'</head><body><h1>Beanstalk — Reports</h1>' \
		'<h2>Coverage (lcov + HTML)</h2><ul>' \
		'<li><a href="coverage/frontend/index.html">Frontend coverage</a> — Vitest / v8 (<code>coverage/frontend/lcov.info</code>)</li>' \
		'<li><a href="coverage/rust/html/index.html">Rust coverage</a> — cargo-llvm-cov (<code>coverage/rust/lcov.info</code>)</li>' \
		'</ul><h2>Test results (JUnit XML)</h2><ul>' \
		'<li><code>testing/frontend.junit.xml</code> — Vitest</li>' \
		'<li><code>testing/rust.junit.xml</code> — cargo-nextest</li>' \
		'</ul></body></html>' \
		> $(REPORTS)/index.html
	@echo "Wrote $(REPORTS)/index.html"

install: clean ## Build and install the app to ~/Applications (macOS)
	cd src-tauri && cargo tauri build
	rm -rf "$(HOME)/Applications/Beanstalk.app"
	# Copy INTO ~/Applications, not onto the .app path: `cp -R src.app dest.app`
	# nests a copy inside an existing bundle instead of replacing it, which
	# silently leaves the old build in place.
	cp -R src-tauri/target/release/bundle/macos/Beanstalk.app "$(HOME)/Applications/"
