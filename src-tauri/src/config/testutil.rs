// Test-only helpers shared by the unit tests.
use std::path::PathBuf;

/// A temp directory removed when dropped, so a test run leaves nothing behind.
pub struct TempDir(pub PathBuf);

impl TempDir {
    pub fn new(prefix: &str, suffix: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "{prefix}_{suffix}_{}_{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .subsec_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        TempDir(dir)
    }
}

impl std::ops::Deref for TempDir {
    type Target = PathBuf;
    fn deref(&self) -> &PathBuf {
        &self.0
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
