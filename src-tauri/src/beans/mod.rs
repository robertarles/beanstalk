// Beans module: data models and file parsing for the beans issue tracker format.

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

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
    pub assignee: Option<String>,
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
        }
    }
}

// ── YAML frontmatter extraction (beanstalk-pd2e) ────────────────────────────

/// Split a beans file's raw content into a frontmatter map and a body string.
///
/// Handles:
/// - Missing opening `---` → returns empty map and the full content as body.
/// - Missing closing `---` → returns empty map and the full content as body.
/// - Malformed YAML inside the delimiters → logs the error, returns empty map.
pub fn extract_frontmatter(content: &str) -> (HashMap<String, serde_yaml::Value>, String) {
    // A valid frontmatter block starts with "---" on the very first line.
    let after_open = if let Some(rest) = content.strip_prefix("---\n") {
        rest
    } else if let Some(rest) = content.strip_prefix("---\r\n") {
        rest
    } else {
        log::debug!("extract_frontmatter: no opening '---' delimiter found");
        return (HashMap::new(), content.to_string());
    };

    // Find the closing delimiter — accept "\n---\n", "\n---\r\n", or "\n---" at EOF.
    let close_pos = after_open
        .find("\n---\n")
        .or_else(|| after_open.find("\n---\r\n"))
        .or_else(|| {
            if after_open.ends_with("\n---") {
                Some(after_open.len() - 4)
            } else {
                None
            }
        });

    let (yaml_str, raw_body) = match close_pos {
        Some(pos) => {
            let yaml_part = &after_open[..pos];
            // Skip past "\n---" then consume the rest of that line.
            let after_marker = &after_open[pos + 4..]; // skip "\n---"
            let body = if after_marker.starts_with("\r\n") {
                after_marker[2..].to_string()
            } else if after_marker.starts_with('\n') {
                after_marker[1..].to_string()
            } else {
                after_marker.to_string()
            };
            (yaml_part, body)
        }
        None => {
            log::debug!("extract_frontmatter: no closing '---' delimiter found");
            return (HashMap::new(), content.to_string());
        }
    };

    match serde_yaml::from_str::<HashMap<String, serde_yaml::Value>>(yaml_str) {
        Ok(map) => (map, raw_body),
        Err(e) => {
            eprintln!("extract_frontmatter: failed to parse YAML frontmatter: {e}");
            (HashMap::new(), content.to_string())
        }
    }
}

// ── Bean file parser (beanstalk-rh93) ───────────────────────────────────────

/// Parse a single `.md` bean file from `path` into a [`Bean`].
pub fn parse_bean_file(path: &Path) -> Result<Bean> {
    log::debug!("parse_bean_file: reading {:?}", path);

    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read bean file: {}", path.display()))?;

    let (fm, body) = extract_frontmatter(&content);

    let get_str = |key: &str| -> String {
        fm.get(key)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    };

    let get_opt_str = |key: &str| -> Option<String> {
        fm.get(key)
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    };

    let get_str_vec = |key: &str| -> Vec<String> {
        fm.get(key)
            .and_then(|v| v.as_sequence())
            .map(|seq| {
                seq.iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default()
    };

    let tags: Vec<String> = get_str_vec("tags");

    // beans stores the ID as a YAML comment (e.g. `# D.-0ajs`), which serde_yaml
    // strips. If `id:` key is absent, extract the ID from the filename stem:
    // filename format is `{id}--{slug}.md`, so everything before the first `--`.
    let id = {
        let from_fm = get_str("id");
        if !from_fm.is_empty() {
            from_fm
        } else {
            // Try YAML comment: scan raw frontmatter lines for `# <id>`
            let comment_id = {
                let after_open = content.strip_prefix("---\n").or_else(|| content.strip_prefix("---\r\n")).unwrap_or("");
                after_open.lines()
                    .find(|l| l.starts_with("# ") && !l.contains(' ') == false)
                    .and_then(|l| {
                        let candidate = l.trim_start_matches("# ").trim();
                        if !candidate.is_empty() && !candidate.contains(' ') {
                            Some(candidate.to_string())
                        } else {
                            None
                        }
                    })
            };
            comment_id.unwrap_or_else(|| {
                // Fall back: extract from filename stem before first `--`
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .and_then(|stem| stem.split("--").next())
                    .unwrap_or("")
                    .to_string()
            })
        }
    };
    let title = get_str("title");
    let status = get_str("status");
    let bean_type = fm
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    log::debug!(
        "parse_bean_file: parsed bean id={:?} title={:?} from {:?}",
        id,
        title,
        path
    );

    Ok(Bean {
        id,
        title,
        status,
        bean_type,
        parent: get_opt_str("parent"),
        tags,
        priority: get_opt_str("priority"),
        assignee: get_opt_str("assignee"),
        created_at: get_opt_str("created_at"),
        updated_at: get_opt_str("updated_at"),
        body,
        file_path: path.to_string_lossy().into_owned(),
        children: Vec::new(),
        blocking: get_str_vec("blocking"),
        blocked_by: get_str_vec("blocked_by"),
    })
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

    BeansConfig { name, statuses, prefix, id_length }
}

// ── Directory scanner (beanstalk-lk35) ──────────────────────────────────────

/// Walk the `.beans/` directory under `project_path` and parse every `.md` file.
///
/// Returns a flat [`Vec<Bean>`] — no parent-child relationships are resolved yet.
/// Non-`.md` files are silently skipped.
pub fn scan_beans_directory(project_path: &Path) -> Result<Vec<Bean>> {
    let beans_dir = project_path.join(".beans");

    log::info!("scan_beans_directory: scanning {:?}", beans_dir);

    if !beans_dir.exists() {
        log::debug!(
            "scan_beans_directory: directory {:?} does not exist",
            beans_dir
        );
        return Ok(Vec::new());
    }

    let mut beans = Vec::new();

    // Beans in `.beans/archive` are no longer active (todo, in-progress, draft)
    // so they are not relevant here. Prune the archive directory entirely rather
    // than parsing every file inside it (beanstalk-z25z).
    let archive_dir = beans_dir.join("archive");

    for entry in WalkDir::new(&beans_dir)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| e.path() != archive_dir)
        .filter_map(|e| {
            e.map_err(|err| {
                eprintln!("scan_beans_directory: walkdir error: {err}");
                err
            })
            .ok()
        })
    {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
            log::debug!("scan_beans_directory: skipping non-.md file {:?}", path);
            continue;
        }

        match parse_bean_file(path) {
            Ok(bean) => {
                log::debug!("scan_beans_directory: parsed bean {:?}", bean.id);
                beans.push(bean);
            }
            Err(e) => {
                eprintln!(
                    "scan_beans_directory: failed to parse {:?}: {e:#}",
                    path
                );
            }
        }
    }

    log::info!("scan_beans_directory: found {} bean(s)", beans.len());

    Ok(beans)
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

    // Helper: create a unique temp directory under std::env::temp_dir()
    fn temp_dir(suffix: &str) -> PathBuf {
        let base = std::env::temp_dir();
        let dir = base.join(format!("beanstalk_test_{}_{}", suffix, std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()));
        fs::create_dir_all(&dir).unwrap();
        dir
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
            assignee: None,
            created_at: None,
            updated_at: None,
            body: String::new(),
            file_path: String::new(),
            children: vec![],
            blocking: vec![],
            blocked_by: vec![],
        }
    }

    // ── beanstalk-1k3h: extract_frontmatter ─────────────────────────────────

    #[test]
    fn test_extract_frontmatter_basic() {
        let content = "---\ntitle: Hello\nstatus: open\n---\nBody text here\n";
        let (fm, body) = extract_frontmatter(content);
        assert_eq!(fm.get("title").and_then(|v| v.as_str()), Some("Hello"));
        assert_eq!(fm.get("status").and_then(|v| v.as_str()), Some("open"));
        assert_eq!(body.trim(), "Body text here");
    }

    #[test]
    fn test_extract_frontmatter_missing() {
        let content = "No frontmatter here\njust plain text\n";
        let (fm, body) = extract_frontmatter(content);
        assert!(fm.is_empty());
        assert_eq!(body, content);
    }

    #[test]
    fn test_extract_frontmatter_comment_id() {
        // YAML comment lines are stripped by serde_yaml — the parse must not error
        let content = "---\n# myid\ntitle: CommentBean\nstatus: open\n---\nBody\n";
        let (fm, _body) = extract_frontmatter(content);
        // The comment line is stripped by the YAML parser; other keys must be present
        assert_eq!(fm.get("title").and_then(|v| v.as_str()), Some("CommentBean"));
        assert_eq!(fm.get("status").and_then(|v| v.as_str()), Some("open"));
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

    // ── beanstalk-bwm2: parse_bean_file ─────────────────────────────────────

    #[test]
    fn test_parse_bean_file_basic() {
        let dir = temp_dir("parse_basic");
        let file = dir.join("abc--my-slug.md");
        fs::write(
            &file,
            "---\nid: abc\ntitle: My Bean\nstatus: open\ntype: task\n---\nSome body text\n",
        )
        .unwrap();

        let bean = parse_bean_file(&file).unwrap();
        assert_eq!(bean.id, "abc");
        assert_eq!(bean.title, "My Bean");
        assert_eq!(bean.status, "open");
        assert_eq!(bean.bean_type, "task");
        assert!(bean.body.contains("Some body text"));
    }

    #[test]
    fn test_parse_bean_file_id_from_comment() {
        let dir = temp_dir("parse_comment");
        let file = dir.join("somebean.md");
        fs::write(
            &file,
            "---\n# testid\ntitle: Comment Bean\nstatus: open\n---\nBody\n",
        )
        .unwrap();

        let bean = parse_bean_file(&file).unwrap();
        assert_eq!(bean.id, "testid");
    }

    #[test]
    fn test_parse_bean_file_id_from_filename() {
        let dir = temp_dir("parse_filename");
        let file = dir.join("myid--slug.md");
        // No id: key and no comment id
        fs::write(
            &file,
            "---\ntitle: Filename Bean\nstatus: open\n---\nBody\n",
        )
        .unwrap();

        let bean = parse_bean_file(&file).unwrap();
        assert_eq!(bean.id, "myid");
    }

    #[test]
    fn test_parse_bean_file_missing() {
        let path = PathBuf::from("/nonexistent/path/to/bean.md");
        let result = parse_bean_file(&path);
        assert!(result.is_err());
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

    // ── beanstalk-tssi: scan_beans_directory ─────────────────────────────────

    #[test]
    fn test_scan_beans_directory_empty() {
        let dir = temp_dir("scan_empty");
        fs::create_dir_all(dir.join(".beans")).unwrap();
        let beans = scan_beans_directory(&dir).unwrap();
        assert!(beans.is_empty());
    }

    #[test]
    fn test_scan_beans_directory_with_files() {
        let dir = temp_dir("scan_files");
        let beans_dir = dir.join(".beans");
        fs::create_dir_all(&beans_dir).unwrap();

        for i in 0..3 {
            fs::write(
                beans_dir.join(format!("bean{}--slug.md", i)),
                format!("---\nid: bean{}\ntitle: Bean {}\nstatus: open\n---\nBody\n", i, i),
            )
            .unwrap();
        }

        let beans = scan_beans_directory(&dir).unwrap();
        assert_eq!(beans.len(), 3);
    }

    #[test]
    fn test_scan_beans_directory_skips_non_md() {
        let dir = temp_dir("scan_nonmd");
        let beans_dir = dir.join(".beans");
        fs::create_dir_all(&beans_dir).unwrap();

        fs::write(
            beans_dir.join("bean1--slug.md"),
            "---\nid: bean1\ntitle: Bean 1\nstatus: open\n---\nBody\n",
        )
        .unwrap();
        fs::write(beans_dir.join("notes.txt"), "just a text file").unwrap();

        let beans = scan_beans_directory(&dir).unwrap();
        assert_eq!(beans.len(), 1);
        assert_eq!(beans[0].id, "bean1");
    }

    #[test]
    fn test_scan_beans_directory_skips_archive() {
        let dir = temp_dir("scan_archive");
        let beans_dir = dir.join(".beans");
        let archive_dir = beans_dir.join("archive");
        fs::create_dir_all(&archive_dir).unwrap();

        // Active bean at the top level
        fs::write(
            beans_dir.join("active--slug.md"),
            "---\nid: active\ntitle: Active Bean\nstatus: todo\n---\nBody\n",
        )
        .unwrap();

        // Archived bean nested under .beans/archive — must be ignored
        fs::write(
            archive_dir.join("archived--slug.md"),
            "---\nid: archived\ntitle: Archived Bean\nstatus: completed\n---\nBody\n",
        )
        .unwrap();

        let beans = scan_beans_directory(&dir).unwrap();
        assert_eq!(beans.len(), 1);
        assert_eq!(beans[0].id, "active");
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

    #[test]
    fn test_parse_bean_file_malformed_yaml() {
        let dir = temp_dir("malformed");
        let file = dir.join("bad--yaml.md");
        // Invalid YAML: mismatched indentation / tab character causes parse error
        fs::write(
            &file,
            "---\ntitle: Good\nbad_key: [\nunclosed bracket\n---\nBody\n",
        )
        .unwrap();

        // Should not panic; either returns a bean with defaults or an Ok/Err — no panic
        let result = parse_bean_file(&file);
        // The function returns Ok (with empty-ish fields) because extract_frontmatter
        // falls back to empty map on YAML parse error.
        match result {
            Ok(bean) => {
                // Title will be empty since frontmatter couldn't be parsed
                assert_eq!(bean.title, "");
            }
            Err(_) => {
                // Also acceptable — what matters is no panic
            }
        }
    }
}
