// T6 (P.-2jcn): what Beanstalk lists equals what beans reports.
//
// For every bean `beans list --json --full` returns outside `archive/`, the
// fields id, title, status, type, priority, tags, parent, blocking, blocked_by
// and body equal Beanstalk's `get_beans` (tree flattened), and the id sets match.
//
// Two fixtures:
// - synthetic: the frontmatter shapes found in the personal instance on
//   2026-10-20 (legacy `id:` key, quoted titles, `tags: []`, no priority, no
//   blank line after `---`, parent, blocked_by, an archived bean), with
//   invented content;
// - a copy of a real instance, when BEANSTALK_PARITY_SOURCE names a directory
//   holding `.beans.yml` and `.beans/`. The test copies it again into its own
//   temp dir and refuses a source under the encrypted notes mount, so the live
//   instance is never read by beans or Beanstalk.

mod common;

use std::collections::BTreeMap;
use std::path::Path;

use app_lib::commands::get_beans;
use common::*;
use serde_json::Value;

#[derive(Debug, PartialEq)]
struct View {
    title: String,
    status: String,
    bean_type: String,
    priority: String,
    tags: Vec<String>,
    parent: String,
    blocking: Vec<String>,
    blocked_by: Vec<String>,
    body: String,
}

fn strs(v: Option<&Value>) -> Vec<String> {
    v.and_then(|v| v.as_array()).map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect()).unwrap_or_default()
}

fn s(v: Option<&Value>) -> String {
    v.and_then(|v| v.as_str()).unwrap_or("").to_string()
}

fn from_beans(dir: &Path) -> BTreeMap<String, View> {
    let out = beans(dir, &["list", "--json", "--full"], None);
    let list: Vec<Value> = serde_json::from_str(&out).expect("list json");
    list.into_iter()
        .filter(|b| !s(b.get("path")).starts_with("archive/"))
        .map(|b| {
            (
                s(b.get("id")),
                View {
                    title: s(b.get("title")),
                    status: s(b.get("status")),
                    bean_type: s(b.get("type")),
                    priority: s(b.get("priority")),
                    tags: strs(b.get("tags")),
                    parent: s(b.get("parent")),
                    blocking: strs(b.get("blocking")),
                    blocked_by: strs(b.get("blocked_by")),
                    body: s(b.get("body")),
                },
            )
        })
        .collect()
}

fn from_beanstalk(dir: &Path) -> BTreeMap<String, View> {
    let tree = get_beans(dir.to_string_lossy().into_owned()).unwrap_or_else(|e| panic!("get_beans: {e:?}"));
    flatten(&tree)
        .into_iter()
        .map(|b| {
            (
                b.id.clone(),
                View {
                    title: b.title,
                    status: b.status,
                    bean_type: b.bean_type,
                    priority: b.priority.unwrap_or_default(),
                    tags: b.tags,
                    parent: b.parent.unwrap_or_default(),
                    blocking: b.blocking,
                    blocked_by: b.blocked_by,
                    body: b.body,
                },
            )
        })
        .collect()
}

/// Compare and report every difference, counted per field.
fn assert_parity(dir: &Path, label: &str) {
    let want = from_beans(dir);
    let got = from_beanstalk(dir);
    assert!(!want.is_empty(), "[{label}] beans listed no active beans; the fixture is empty");

    let mut problems: Vec<String> = Vec::new();
    let mut per_field: BTreeMap<&str, usize> = BTreeMap::new();
    for id in want.keys().filter(|k| !got.contains_key(*k)) {
        problems.push(format!("{id}: listed by beans, missing in beanstalk"));
        *per_field.entry("missing").or_default() += 1;
    }
    for id in got.keys().filter(|k| !want.contains_key(*k)) {
        problems.push(format!("{id}: shown by beanstalk, not an active bean in beans"));
        *per_field.entry("extra").or_default() += 1;
    }
    for (id, w) in &want {
        let Some(g) = got.get(id) else { continue };
        let mut check = |field: &'static str, a: String, b: String| {
            if a != b {
                *per_field.entry(field).or_default() += 1;
                problems.push(format!("{id}.{field}: beans={} beanstalk={}", clip(&a), clip(&b)));
            }
        };
        check("title", w.title.clone(), g.title.clone());
        check("status", w.status.clone(), g.status.clone());
        check("type", w.bean_type.clone(), g.bean_type.clone());
        check("priority", w.priority.clone(), g.priority.clone());
        check("tags", format!("{:?}", w.tags), format!("{:?}", g.tags));
        check("parent", w.parent.clone(), g.parent.clone());
        check("blocking", format!("{:?}", w.blocking), format!("{:?}", g.blocking));
        check("blocked_by", format!("{:?}", w.blocked_by), format!("{:?}", g.blocked_by));
        check("body", w.body.clone(), g.body.clone());
    }
    let shown: Vec<&String> = problems.iter().take(25).collect();
    assert!(
        problems.is_empty(),
        "[{label}] {} difference(s) over {} active beans; per field {:?}; first {}:\n{}",
        problems.len(),
        want.len(),
        per_field,
        shown.len(),
        shown.iter().map(|s| s.as_str()).collect::<Vec<_>>().join("\n")
    );
}

/// A value for a failure message: debug-quoted, at most 60 characters, so a
/// report on a real instance shows where fields differ without dumping bodies.
fn clip(v: &str) -> String {
    let q = format!("{v:?}");
    if q.chars().count() <= 60 {
        q
    } else {
        let head: String = q.chars().take(30).collect();
        let tail: String = q.chars().rev().take(25).collect::<Vec<_>>().into_iter().rev().collect();
        format!("{head}…{tail} ({} chars)", v.chars().count())
    }
}

fn write(path: &Path, text: &str) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, text).unwrap();
}

/// The synthetic store, in the shapes of the personal instance.
fn synthetic(p: &Project) {
    let st = &p.store;
    // Canonical, as beans writes it.
    write(&st.join("t6s-can1--canonical.md"), "---\n# t6s-can1\ntitle: Canonical epic\nstatus: todo\ntype: epic\npriority: high\ntags:\n    - alpha\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\n\nEpic body.\n");
    // Child of the epic, blocked by another bean (P8's shape).
    write(&st.join("t6s-chd1--child.md"), "---\n# t6s-chd1\ntitle: Blocked child\nstatus: in-progress\ntype: task\npriority: normal\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\nparent: t6s-can1\nblocked_by:\n    - t6s-blk1\n---\n\nChild body.\n");
    write(&st.join("t6s-blk1--blocker.md"), "---\n# t6s-blk1\ntitle: Blocker\nstatus: todo\ntype: task\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\nblocking:\n    - t6s-chd1\n---\n\nBlocker body.\n");
    // Legacy: `id:` key, double-quoted title, `tags: []`, no blank line after `---`.
    write(&st.join("t6s-leg1.md"), "---\nid: t6s-leg1\ntitle: \"Legacy: quoted\"\nstatus: todo\ntype: task\npriority: low\ntags: []\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\nLegacy body, no blank line.\n");
    // Single-quoted title, no priority, body with a beans-ext block and trailing space.
    write(&st.join("t6s-sq01--single.md"), &format!("---\n# t6s-sq01\ntitle: 'It''s single-quoted'\nstatus: draft\ntype: feature\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\n\nSome text.\n\n{EXT_BLOCK}\n\n"));
    // Archived: neither side may show it.
    write(&st.join("archive/t6s-arc1--archived.md"), "---\n# t6s-arc1\ntitle: Archived\nstatus: completed\ntype: task\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\n\nOld.\n");
}

#[test]
fn t6_parity_on_the_synthetic_fixture() {
    init();
    let p = project("t6s");
    synthetic(&p);
    let ids: Vec<String> = from_beans(&p.dir).into_keys().collect();
    assert_eq!(ids.len(), 5, "fixture: beans should list 5 active beans, got {ids:?}");
    assert!(!ids.contains(&"t6s-arc1".to_string()), "fixture: archive filter");
    assert_parity(&p.dir, "synthetic");
}

#[test]
fn t6_parity_on_a_copy_of_a_real_instance() {
    let h = init();
    let Some(src) = std::env::var_os("BEANSTALK_PARITY_SOURCE") else {
        // Not silently green: the run command sets this. Without it the test
        // cannot say anything about real data.
        panic!("BEANSTALK_PARITY_SOURCE is not set: point it at a COPY of an instance (a dir with .beans.yml and .beans/)");
    };
    let src = Path::new(&src).canonicalize().expect("parity source exists");
    for live in ["decrypted.mnt", "Documents/enc.robert", "decrypted.rra"] {
        let live_root = h.original_home.join(live);
        let live_real = live_root.canonicalize().unwrap_or(live_root);
        assert!(!src.starts_with(&live_real), "refusing a parity source inside the live notes ({live_real:?}); copy it to scratch first");
    }
    assert!(src.join(".beans.yml").is_file() && src.join(".beans").is_dir(), "parity source {src:?} lacks .beans.yml or .beans/");

    let s = Scratch::new("t6r");
    let dst = s.root.join("inst");
    copy_dir(&src.join(".beans"), &dst.join(".beans"));
    std::fs::copy(src.join(".beans.yml"), dst.join(".beans.yml")).unwrap();
    assert_parity(&dst, "real copy");
}

fn copy_dir(from: &Path, to: &Path) {
    for e in walkdir::WalkDir::new(from) {
        let e = e.unwrap();
        let rel = e.path().strip_prefix(from).unwrap();
        let target = to.join(rel);
        if e.file_type().is_dir() {
            std::fs::create_dir_all(&target).unwrap();
        } else if e.file_type().is_file() {
            std::fs::copy(e.path(), &target).unwrap();
        }
    }
}
