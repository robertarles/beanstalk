.DEFAULT_GOAL := help
.PHONY: help all clean build test coverage report-index install build-fedora

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

# ── Linux (Fedora) build ──────────────────────────────────────────────────────
# Run `build-fedora` ON the Fedora host — e.g. the `empire` aarch64 guest — from
# its own clone of this repo. It cannot be driven from macOS: Tauri links the app
# against the host's GTK3 + webkit2gtk stack, so the build must be native.
#
# One-time host setup:
#   sudo dnf install -y gcc gcc-c++ make pkgconf-pkg-config openssl-devel \
#     webkit2gtk4.1-devel gtk3-devel librsvg2-devel libappindicator-gtk3-devel \
#     rpm-build patchelf nodejs npm
#   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
#   cargo install tauri-cli --version '^2' --locked

# Dev libraries Tauri needs at link time, by pkg-config name.
FEDORA_DEV_LIBS := webkit2gtk-4.1 gtk+-3.0 librsvg-2.0

build-fedora: ## Build the Linux rpm bundle (run on the Fedora host, not macOS)
	@[ "$$(uname -s)" = Linux ] || { \
		echo "build-fedora must run on the Fedora host; this is $$(uname -s)."; \
		echo "Clone the repo there (e.g. \`limactl shell empire\`) and run it from that checkout."; \
		exit 1; }
	@command -v cargo >/dev/null || { \
		echo "cargo not found. Install rustup:"; \
		echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"; \
		exit 1; }
	@command -v cargo-tauri >/dev/null || { \
		echo "cargo-tauri not found. Install it:"; \
		echo "  cargo install tauri-cli --version '^2' --locked"; \
		exit 1; }
	@command -v npm >/dev/null || { echo "npm not found: sudo dnf install -y nodejs npm"; exit 1; }
	@missing=""; for lib in $(FEDORA_DEV_LIBS); do \
		pkg-config --exists "$$lib" || missing="$$missing $$lib"; \
	done; \
	[ -z "$$missing" ] || { \
		echo "Missing dev libraries:$$missing"; \
		echo "  sudo dnf install -y webkit2gtk4.1-devel gtk3-devel librsvg2-devel libappindicator-gtk3-devel"; \
		exit 1; }
	@[ -d node_modules ] || npm ci
	# `cargo tauri build` runs beforeBuildCommand (npm run build) itself, so the
	# frontend is rebuilt here too. No `clean` prerequisite: a cargo clean would
	# force a full recompile of the dependency tree on every Linux build.
	cd src-tauri && cargo tauri build --bundles rpm
	@echo
	@echo "rpm bundle: src-tauri/target/release/bundle/rpm/"
	@ls -1 src-tauri/target/release/bundle/rpm/*.rpm 2>/dev/null || true
