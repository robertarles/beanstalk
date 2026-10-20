// Beans module: data models and file parsing for the beans issue tracker format.

use std::path::Path;

use serde::{Deserialize, Serialize};

// ── Data models (beanstalk-3wln) ────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bean {
    pub id: String,
    pub title: String,
    pub status: String,
    pub bean_type: String, // "task", "epic", "milestone"
    pub parent: Option<String>,
    pub tags: Vec<String>,
    pub priority: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub body: String,
    pub file_path: String,
    pub children: Vec<Bean>,
    pub blocking: Vec<String>,
    pub blocked_by: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeansConfig {
    pub name: Option<String>,
    pub statuses: Vec<String>,
    pub prefix: Option<String>,
    pub id_length: Option<u32>,
    /// Where the bean files live, as written in `.beans.yml`, relative to the project.
    pub path: Option<String>,
}

impl Default for BeansConfig {
    fn default() -> Self {
        BeansConfig {
            name: None,
            statuses: vec![
                "open".to_string(),
                "in-progress".to_string(),
                "done".to_string(),
                "archived".to_string(),
            ],
            prefix: None,
            id_length: None,
            path: None,
        }
    }
}

// ── Config parser (beanstalk-vxr0) ──────────────────────────────────────────

/// Load the beans project config from `.beans.yml` in `project_path`.
///
/// Returns [`BeansConfig::default`] if the file is absent or cannot be parsed.
pub fn parse_beans_config(project_path: &Path) -> BeansConfig {
    let config_path = project_path.join(".beans.yml");

    log::debug!("parse_beans_config: looking for config at {:?}", config_path);

    let content = match std::fs::read_to_string(&config_path) {
        Ok(c) => c,
        Err(e) => {
            log::debug!(
                "parse_beans_config: could not read {:?}: {e}",
                config_path
            );
            return BeansConfig::default();
        }
    };

    let raw: serde_yaml::Value = match serde_yaml::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            eprintln!(
                "parse_beans_config: failed to parse {:?}: {e}",
                config_path
            );
            return BeansConfig::default();
        }
    };

    // The config may be nested under a `beans:` key (project-local format)
    // or at the top level (legacy format). Prefer the nested form.
    let root = raw.get("beans").unwrap_or(&raw);

    let name = root
        .get("name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let statuses: Vec<String> = root
        .get("statuses")
        .and_then(|v| v.as_sequence())
        .map(|seq| {
            seq.iter()
                .filter_map(|item| item.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_else(|| BeansConfig::default().statuses);

    let prefix = root
        .get("prefix")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    let id_length = root
        .get("id_length")
        .and_then(|v| v.as_u64())
        .map(|n| n as u32);

    log::debug!(
        "parse_beans_config: loaded config name={:?} prefix={:?} id_length={:?} statuses={:?}",
        name, prefix, id_length, statuses
    );

    let path = root
        .get("path")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    BeansConfig { name, statuses, prefix, id_length, path }
}

// ── Tree builder (beanstalk-aq2y) ────────────────────────────────────────────

/// Organise a flat list of beans into a forest where each top-level bean
/// (no `parent`) contains its direct and transitive descendants in `children`.
///
/// Beans whose declared parent ID cannot be found after all passes are promoted
/// to the top level and an error is logged.
pub fn build_tree(beans: Vec<Bean>) -> Vec<Bean> {
    // Separate into top-level beans (no parent) and children.
    let (mut roots, mut unplaced): (Vec<Bean>, Vec<Bean>) =
        beans.into_iter().partition(|b| b.parent.is_none());

    // Multi-pass: each pass may place beans that become parents for the next.
    const MAX_PASSES: usize = 64;

    for _pass in 0..MAX_PASSES {
        if unplaced.is_empty() {
            break;
        }

        let before_count = unplaced.len();
        let mut next_unplaced: Vec<Bean> = Vec::new();

        for child in unplaced {
            let parent_id = child.parent.clone().unwrap_or_default();
            match place_bean(&mut roots, &parent_id, child) {
                Ok(()) => {}
                Err(returned) => next_unplaced.push(returned),
            }
        }

        // If no progress was made this pass, remaining beans are true orphans.
        if next_unplaced.len() == before_count {
            unplaced = next_unplaced;
            break;
        }

        unplaced = next_unplaced;
    }

    // Promote orphans to the top level with a diagnostic message.
    for orphan in unplaced {
        eprintln!(
            "build_tree: orphan bean {:?} references unknown parent {:?}; promoting to top level",
            orphan.id, orphan.parent
        );
        roots.push(orphan);
    }

    roots
}

/// Recursively search `nodes` (and their children) for a bean whose id equals
/// `parent_id`, then append `child` to its `children` list.
///
/// Returns `Ok(())` on success or `Err(child)` if the parent was not found
/// anywhere in the subtree, returning ownership of `child` to the caller.
fn place_bean(nodes: &mut Vec<Bean>, parent_id: &str, child: Bean) -> std::result::Result<(), Bean> {
    for node in nodes.iter_mut() {
        if node.id == parent_id {
            node.children.push(child);
            return Ok(());
        }
    }
    // Not found at this level — recurse into children.
    let mut current_child = child;
    for node in nodes.iter_mut() {
        match place_bean(&mut node.children, parent_id, current_child) {
            Ok(()) => return Ok(()),
            Err(returned) => current_child = returned,
        }
    }
    Err(current_child)
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    /// A unique temp directory, removed when dropped.
    struct TempDir(PathBuf);

    impl std::ops::Deref for TempDir {
        type Target = PathBuf;
        fn deref(&self) -> &PathBuf {
            &self.0
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn temp_dir(suffix: &str) -> TempDir {
        let dir = std::env::temp_dir().join(format!(
            "beanstalk_test_{suffix}_{}_{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .subsec_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        TempDir(dir)
    }

    // Helper: build a minimal Bean for use in tree tests
    fn make_bean(id: &str, parent: Option<&str>) -> Bean {
        Bean {
            id: id.to_string(),
            title: format!("Title {}", id),
            status: "open".to_string(),
            bean_type: "task".to_string(),
            parent: parent.map(|s| s.to_string()),
            tags: vec![],
            priority: None,
            created_at: None,
            updated_at: None,
            body: String::new(),
            file_path: String::new(),
            children: vec![],
            blocking: vec![],
            blocked_by: vec![],
        }
    }

    // ── beanstalk-hwj3: Bean / BeansConfig struct tests ──────────────────────

    #[test]
    fn test_bean_serialization() {
        let bean = make_bean("abc123", None);
        let json = serde_json::to_string(&bean).unwrap();
        let restored: Bean = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.id, "abc123");
        assert_eq!(restored.title, "Title abc123");
        assert_eq!(restored.status, "open");
        assert!(restored.children.is_empty());
        assert!(restored.parent.is_none());
    }

    #[test]
    fn test_beans_config_default() {
        let cfg = BeansConfig::default();
        assert!(!cfg.statuses.is_empty(), "default statuses must not be empty");
        assert!(cfg.statuses.contains(&"open".to_string()));
        assert!(cfg.statuses.contains(&"done".to_string()));
    }

    // ── beanstalk-f01c: parse_beans_config ──────────────────────────────────

    #[test]
    fn test_parse_beans_config_default() {
        // A path with no .beans.yml should return default statuses
        let dir = temp_dir("config_default");
        let cfg = parse_beans_config(&dir);
        assert!(!cfg.statuses.is_empty());
        assert!(cfg.statuses.contains(&"open".to_string()));
    }

    #[test]
    fn test_parse_beans_config_reads_path() {
        let dir = temp_dir("config_path");
        fs::write(dir.join(".beans.yml"), "beans:\n    path: ../store\n    prefix: x-\n").unwrap();
        assert_eq!(parse_beans_config(&dir).path.as_deref(), Some("../store"));
        assert_eq!(parse_beans_config(&temp_dir("config_nopath")).path, None);
    }

    #[test]
    fn test_parse_beans_config_with_file() {
        let dir = temp_dir("config_file");
        let config_file = dir.join(".beans.yml");
        fs::write(
            &config_file,
            "name: MyProject\nstatuses:\n  - todo\n  - wip\n  - closed\n",
        )
        .unwrap();

        let cfg = parse_beans_config(&dir);
        assert_eq!(cfg.name.as_deref(), Some("MyProject"));
        assert_eq!(cfg.statuses, vec!["todo", "wip", "closed"]);
    }

    // ── beanstalk-kn8f: build_tree ───────────────────────────────────────────

    #[test]
    fn test_build_tree_flat() {
        let beans = vec![
            make_bean("a", None),
            make_bean("b", None),
            make_bean("c", None),
        ];
        let tree = build_tree(beans);
        assert_eq!(tree.len(), 3);
        for node in &tree {
            assert!(node.children.is_empty());
        }
    }

    #[test]
    fn test_build_tree_parent_child() {
        let beans = vec![
            make_bean("parent", None),
            make_bean("child", Some("parent")),
        ];
        let tree = build_tree(beans);
        // Only the root should be at top level
        assert_eq!(tree.len(), 1);
        assert_eq!(tree[0].id, "parent");
        assert_eq!(tree[0].children.len(), 1);
        assert_eq!(tree[0].children[0].id, "child");
    }

    #[test]
    fn test_build_tree_orphan() {
        let beans = vec![
            make_bean("a", None),
            make_bean("orphan", Some("nonexistent-parent")),
        ];
        let tree = build_tree(beans);
        // Orphan should be promoted to root
        assert_eq!(tree.len(), 2);
        let ids: Vec<&str> = tree.iter().map(|b| b.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"orphan"));
    }

    // ── beanstalk-g8i0: error handling ──────────────────────────────────────

}
