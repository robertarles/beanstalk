.PHONY: all clean build test install

all: build

# Remove build artifacts
clean:
	rm -rf dist
	cd src-tauri && cargo clean

# Build frontend + Rust (production bundle)
build: clean
	npm run build
	cd src-tauri && cargo build --release

# Run all tests (Rust unit tests + frontend Vitest)
test:
	cd src-tauri && cargo test
	npm test

# Install the app to /Applications (macOS)
install: clean 
	cd src-tauri && cargo tauri build
	rm -rf /Applications/Beanstalk.app
	cp -r src-tauri/target/release/bundle/macos/Beanstalk.app /Applications/Beanstalk.app
