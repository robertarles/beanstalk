.PHONY: all clean build test install

all: build

# Remove build artifacts
clean:
	rm -rf dist
	cd src-tauri && cargo clean

# Build frontend + Rust (production bundle)
build:
	npm run build
	cd src-tauri && cargo build --release

# Run all tests (Rust unit tests + frontend Vitest)
test:
	cd src-tauri && cargo test
	npm test

# Install the app to /Applications (macOS)
install: build
	cd src-tauri && cargo tauri build
	cp -r src-tauri/target/release/bundle/macos/Beanstalk.app /Applications/Beanstalk.app
