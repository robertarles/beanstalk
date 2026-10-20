// Shared harness for the beans-backend acceptance tests T1-T9 (P.-2jcn / P.-e5n8).
//
// Every test binary that includes this module runs with a throwaway `HOME`, so
// Beanstalk's own config (`<config_dir>/Beanstalk/config.json`) is read from and
// written to a temp directory, never the user's. Bean data lives in temp
// projects and is seeded and changed with the real `beans` binary.
//
// Tests fail rather than skip when `beans` is missing: a skipped acceptance test
// reads as a pass.

#![allow(dead_code)]

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::OnceLock;

use app_lib::beans::Bean;

/// What `init` set up, shared by every test in the binary.
pub struct Harness {
    /// The throwaway HOME.
    pub home: PathBuf,
    /// The real `beans` binary used to seed and inspect fixtures.
    pub beans: PathBuf,
    /// HOME before the override, for guards only.
    pub original_home: PathBuf,
}

static HARNESS: OnceLock<Harness> = OnceLock::new();
static HOME_TO_REMOVE: OnceLock<PathBuf> = OnceLock::new();

extern "C" {
    fn atexit(callback: extern "C" fn()) -> i32;
}

/// Removes the throwaway HOME when the test process exits. A `static` is never
/// dropped, so `Drop` cannot do it; `atexit` runs after the last test.
extern "C" fn remove_home() {
    if std::env::var_os("BEANSTALK_TEST_KEEP").is_none() {
        if let Some(home) = HOME_TO_REMOVE.get() {
            let _ = std::fs::remove_dir_all(home);
        }
    }
}
static COUNTER: AtomicUsize = AtomicUsize::new(0);

/// Locate the real `beans`: `BEANSTALK_TEST_BEANS`, else `PATH`, else Homebrew.
fn find_beans() -> PathBuf {
    if let Some(p) = std::env::var_os("BEANSTALK_TEST_BEANS") {
        return PathBuf::from(p);
    }
    if let Some(path) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path) {
            let c = dir.join("beans");
            if c.is_file() {
                return c;
            }
        }
    }
    PathBuf::from("/opt/homebrew/bin/beans")
}

/// Isolate HOME and write a Beanstalk config pointing `beans_bin` at `beans_bin`
/// (the real binary by default) and `editor` at `editor`.
///
/// Called once per test binary; later calls return the same harness.
pub fn init_with(beans_bin: Option<&dyn Fn(&Path) -> PathBuf>, editor: Option<&dyn Fn(&Path) -> PathBuf>) -> &'static Harness {
    HARNESS.get_or_init(|| {
        let beans = find_beans();
        assert!(
            beans.is_file(),
            "the real `beans` binary is required (looked for {beans:?}); set BEANSTALK_TEST_BEANS"
        );
        let original_home = PathBuf::from(std::env::var_os("HOME").expect("HOME is set"));

        let home = unique_dir("home");
        let _ = HOME_TO_REMOVE.set(home.clone());
        unsafe { atexit(remove_home) };
        std::env::set_var("HOME", &home);

        // Guard: the config path must now be inside the throwaway HOME. If `dirs`
        // ignored HOME, every config read below would hit the real file.
        let cfg_path = app_lib::config::config_path().expect("config path");
        assert!(
            cfg_path.starts_with(&home),
            "config path {cfg_path:?} is not under the throwaway HOME {home:?}; refusing to run"
        );

        let bin = match beans_bin {
            Some(f) => f(&home),
            None => beans.clone(),
        };
        let mut cfg = serde_json::json!({
            "projects": [],
            "last_active_project": null,
            "editor": null,
            "beans_bin": bin.to_string_lossy(),
        });
        if let Some(f) = editor {
            cfg["editor"] = serde_json::Value::String(f(&home).to_string_lossy().into_owned());
        }
        std::fs::create_dir_all(cfg_path.parent().unwrap()).unwrap();
        std::fs::write(&cfg_path, serde_json::to_string_pretty(&cfg).unwrap()).unwrap();

        Harness { home, beans, original_home }
    })
}

pub fn init() -> &'static Harness {
    init_with(None, None)
}

/// A fresh directory under the system temp dir. Kept when BEANSTALK_TEST_KEEP is set.
pub fn unique_dir(tag: &str) -> PathBuf {
    let n = COUNTER.fetch_add(1, Ordering::SeqCst);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let p = std::env::temp_dir().join(format!("beanstalk_accept_{tag}_{}_{n}_{nanos}", std::process::id()));
    std::fs::create_dir_all(&p).expect("create temp dir");
    // Canonical, so comparisons with paths beans reports are not tripped by
    // /var -> /private/var on macOS.
    p.canonicalize().unwrap()
}

/// A temp directory removed on drop.
pub struct Scratch {
    pub root: PathBuf,
}

impl Scratch {
    pub fn new(tag: &str) -> Self {
        Scratch { root: unique_dir(tag) }
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        if std::env::var_os("BEANSTALK_TEST_KEEP").is_none() {
            let _ = std::fs::remove_dir_all(&self.root);
        }
    }
}

/// A beans project: a directory with a `.beans.yml`, and the store it points at.
pub struct Project {
    pub scratch: Scratch,
    /// The directory Beanstalk is given as the project path.
    pub dir: PathBuf,
    /// Where the bean files actually live.
    pub store: PathBuf,
    pub prefix: String,
}

impl Project {
    pub fn dir_str(&self) -> String {
        self.dir.to_string_lossy().into_owned()
    }
}

/// A project whose store is the default `<project>/.beans`, created up front the
/// way `beans init` leaves it.
pub fn project(tag: &str) -> Project {
    let scratch = Scratch::new(tag);
    let dir = scratch.root.join("proj");
    std::fs::create_dir_all(dir.join(".beans")).unwrap();
    let prefix = format!("{tag}-");
    std::fs::write(
        dir.join(".beans.yml"),
        format!("beans:\n    path: .beans\n    prefix: {prefix}\n    id_length: 4\n    default_status: todo\n    default_type: task\n"),
    )
    .unwrap();
    let store = dir.join(".beans");
    Project { scratch, dir, store, prefix }
}

/// A project whose `.beans.yml` points at a central store outside it
/// (`path: ../store`), as `~/src/robertarles/beanstalk` does on terminus.
/// `<project>/.beans` does not exist.
pub fn project_with_central_store(tag: &str) -> Project {
    let scratch = Scratch::new(tag);
    let dir = scratch.root.join("proj");
    let store = scratch.root.join("store");
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::create_dir_all(&store).unwrap();
    let prefix = format!("{tag}-");
    std::fs::write(
        dir.join(".beans.yml"),
        format!("beans:\n    path: ../store\n    prefix: {prefix}\n    id_length: 4\n    default_status: todo\n    default_type: task\n"),
    )
    .unwrap();
    Project { scratch, dir, store, prefix }
}

/// Run the real `beans` in `dir` (no `--beans-path`: beans resolves `.beans.yml`).
pub fn beans(dir: &Path, args: &[&str], stdin: Option<&str>) -> String {
    use std::io::Write;
    let h = init();
    let mut cmd = Command::new(&h.beans);
    cmd.current_dir(dir)
        .args(args)
        .stdin(if stdin.is_some() { Stdio::piped() } else { Stdio::null() })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = cmd.spawn().expect("spawn beans");
    if let Some(s) = stdin {
        let mut p = child.stdin.take().unwrap();
        p.write_all(s.as_bytes()).unwrap();
        drop(p);
    }
    let out = child.wait_with_output().expect("wait beans");
    assert!(
        out.status.success(),
        "beans {args:?} failed in {dir:?}: {}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    String::from_utf8_lossy(&out.stdout).into_owned()
}

/// Create a bean with the real CLI and return its id.
pub fn seed(p: &Project, title: &str, extra: &[&str], body: Option<&str>) -> String {
    let mut args = vec!["create", title];
    args.extend_from_slice(extra);
    if body.is_some() {
        args.extend_from_slice(&["-d", "-"]);
    }
    args.push("--json");
    let out = beans(&p.dir, &args, body);
    let v: serde_json::Value = serde_json::from_str(&out).expect("create json");
    v["bean"]["id"].as_str().expect("id").to_string()
}

/// `beans show --json <id>` as a JSON value.
pub fn show(p: &Project, id: &str) -> serde_json::Value {
    let out = beans(&p.dir, &["show", "--json", id], None);
    serde_json::from_str(&out).expect("show json")
}

/// The bean file for `id`, found by beans (its `path` is relative to the store).
pub fn file_of(p: &Project, id: &str) -> PathBuf {
    let v = show(p, id);
    p.store.join(v["path"].as_str().expect("path"))
}

pub fn read(path: &Path) -> String {
    std::fs::read_to_string(path).unwrap_or_else(|e| panic!("read {path:?}: {e}"))
}

/// `beans show --raw <id>`: the bean as beans renders it.
///
/// beans 0.4.2 renders the defaulted `priority: normal` on show but omits it on
/// write when the bean has no priority (verified 2026-10-20 on a bean beans itself
/// created). That line is the one known render-only difference, so it is removed
/// when the file has no priority line; nothing else is normalised.
pub fn canonical_for(p: &Project, id: &str, file_text: &str) -> String {
    let raw = beans(&p.dir, &["show", "--raw", id], None);
    let file_has_priority = frontmatter(file_text).lines().any(|l| l.starts_with("priority:"));
    if file_has_priority {
        raw
    } else {
        // The first occurrence is in the frontmatter, which comes first.
        raw.replacen("\npriority: normal\n", "\n", 1)
    }
}

/// The frontmatter block (between the first two `---` lines), or "".
pub fn frontmatter(text: &str) -> String {
    let mut lines = text.lines();
    if lines.next() != Some("---") {
        return String::new();
    }
    lines.take_while(|l| *l != "---").map(|l| format!("{l}\n")).collect()
}

/// Assert the file for `id` is exactly what beans renders, and carries none of
/// the keys Beanstalk's old writer emitted.
pub fn assert_canonical(p: &Project, id: &str, step: &str) {
    let path = file_of(p, id);
    let text = read(&path);
    let fm = frontmatter(&text);
    for bad in ["id:", "assignee:", "tags: []"] {
        assert!(
            !fm.lines().any(|l| l.trim_start().starts_with(bad)),
            "[{step}] frontmatter of {id} carries `{bad}`, which beans never writes:\n{text}"
        );
    }
    assert!(
        fm.lines().next() == Some(&format!("# {id}")),
        "[{step}] frontmatter of {id} does not start with the `# {id}` comment beans writes:\n{text}"
    );
    let want = canonical_for(p, id, &text);
    assert_eq!(text, want, "[{step}] file bytes of {id} differ from `beans show --raw`");
}

/// Every bean in a Beanstalk tree, depth first.
pub fn flatten(beans: &[Bean]) -> Vec<Bean> {
    let mut out = Vec::new();
    for b in beans {
        out.push(b.clone());
        out.extend(flatten(&b.children));
    }
    out
}

/// The file's bytes, for before/after comparison.
pub fn bytes(path: &Path) -> Vec<u8> {
    std::fs::read(path).unwrap_or_else(|e| panic!("read {path:?}: {e}"))
}

/// Every file under `root` with its bytes and mtime, sorted by path.
pub fn tree_state(root: &Path) -> Vec<(PathBuf, Vec<u8>, std::time::SystemTime)> {
    let mut out = Vec::new();
    if !root.exists() {
        return out;
    }
    for e in walkdir::WalkDir::new(root).sort_by_file_name() {
        let e = e.unwrap();
        if e.file_type().is_file() {
            let md = e.metadata().unwrap();
            out.push((e.path().to_path_buf(), std::fs::read(e.path()).unwrap(), md.modified().unwrap()));
        }
    }
    out
}

/// The text of the ```yaml beans-ext block in `body`, fences included.
pub fn ext_block(body: &str) -> Option<String> {
    let start = body.find("```yaml beans-ext\n")?;
    let rest = &body[start..];
    let close = rest["```yaml beans-ext\n".len()..].find("\n```")? + "```yaml beans-ext\n".len() + 4;
    Some(rest[..close].to_string())
}

pub const EXT_BLOCK: &str = "```yaml beans-ext\next: 1\njira:\n  key: \"ABC-123\"\njira_log:\n  - at: \"2026-10-20T15:04:00-07:00\"\n    by: robert\n    kind: comment\n    text: |\n      Vendor confirmed the fix lands in 4.2.\n      Waiting on their build.\n```";
