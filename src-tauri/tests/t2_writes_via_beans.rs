// T2 (P.-2jcn): every Beanstalk write leaves the bean file exactly as beans
// renders it, with none of the keys Beanstalk's old writer emitted (`id:`,
// `assignee:`, `tags: []`), and a beans-ext block in the body survives.
//
// Design deviation, measured: `beans show --raw` adds `priority: normal` for a
// bean with no priority, which beans itself does not write; that one line is
// normalised (see common::canonical_for).

mod common;

use app_lib::commands::{create_bean, update_bean, update_bean_status};
use common::*;

fn update(p: &Project, id: &str, f: impl FnOnce(&mut Upd)) {
    let mut u = Upd::default();
    f(&mut u);
    update_bean(
        p.dir_str(),
        id.to_string(),
        u.title,
        u.status,
        u.tags,
        u.body,
        u.parent,
        u.priority,
        u.blocking,
        u.blocked_by,
        u.expect_body,
        u.expect_tags,
        u.expect_blocking,
        u.expect_blocked_by,
    )
    .unwrap_or_else(|e| panic!("update_bean {id}: {e:?}"));
}

#[derive(Default)]
struct Upd {
    title: Option<String>,
    status: Option<String>,
    tags: Option<Vec<String>>,
    body: Option<String>,
    parent: Option<String>,
    priority: Option<String>,
    blocking: Option<Vec<String>>,
    blocked_by: Option<Vec<String>>,
    expect_body: Option<String>,
    expect_tags: Option<Vec<String>>,
    expect_blocking: Option<Vec<String>>,
    expect_blocked_by: Option<Vec<String>>,
}

fn s(v: &str) -> Option<String> {
    Some(v.to_string())
}

fn v(items: &[&str]) -> Option<Vec<String>> {
    Some(items.iter().map(|s| s.to_string()).collect())
}

#[test]
fn t2_create_writes_the_beans_format() {
    init();
    let p = project("t2c");
    let epic = seed(&p, "An epic", &["-t", "epic"], None);
    let other = seed(&p, "Other", &[], None);
    let bean = create_bean(
        p.dir_str(),
        "Title: with \"quotes\" and #hash".to_string(),
        "todo".to_string(),
        "task".to_string(),
        s(&epic),
        v(&["alpha", "beta"]),
        s("high"),
        s("First line.\n\nSecond paragraph.\n"),
        v(&[&other]),
        None,
    )
    .unwrap_or_else(|e| panic!("create_bean: {e:?}"));
    assert_eq!(show(&p, &bean.id)["title"], "Title: with \"quotes\" and #hash");
    assert_canonical(&p, &bean.id, "create with every field");

    let bare = create_bean(p.dir_str(), "Bare".into(), "todo".into(), "task".into(), None, Some(vec![]), None, None, None, None)
        .unwrap_or_else(|e| panic!("create_bean bare: {e:?}"));
    assert_canonical(&p, &bare.id, "create with no optional fields");
}

#[test]
fn t2_every_field_update_writes_the_beans_format() {
    init();
    let p = project("t2u");
    let epic = seed(&p, "Epic", &["-t", "epic"], None);
    let other = seed(&p, "Other", &[], None);
    let third = seed(&p, "Third", &[], None);
    let id = seed(&p, "Subject", &["--tag", "keep", "--tag", "drop"], Some("Original body.\n"));
    assert_canonical(&p, &id, "seed");

    update(&p, &id, |u| u.title = s("New: title"));
    assert_canonical(&p, &id, "title");
    update_bean_status(p.dir_str(), id.clone(), "in-progress".into()).unwrap();
    assert_eq!(show(&p, &id)["status"], "in-progress");
    assert_canonical(&p, &id, "status");
    update(&p, &id, |u| u.priority = s("critical"));
    assert_eq!(show(&p, &id)["priority"], "critical");
    assert_canonical(&p, &id, "priority set");
    update(&p, &id, |u| u.priority = s(""));
    assert_canonical(&p, &id, "priority cleared");
    update(&p, &id, |u| u.parent = s(&epic));
    assert_eq!(show(&p, &id)["parent"], epic.as_str());
    assert_canonical(&p, &id, "parent set");
    update(&p, &id, |u| u.parent = s(""));
    assert!(show(&p, &id).get("parent").map_or(true, |v| v.is_null() || v == ""), "parent not cleared");
    assert_canonical(&p, &id, "parent cleared");
    update(&p, &id, |u| u.tags = v(&["keep", "new"]));
    let mut tags: Vec<String> = show(&p, &id)["tags"].as_array().unwrap().iter().map(|t| t.as_str().unwrap().to_string()).collect();
    tags.sort(); // order is beans' business, not part of the claim
    assert_eq!(tags, vec!["keep", "new"]);
    assert_canonical(&p, &id, "tags diff");
    update(&p, &id, |u| u.tags = v(&[]));
    assert_canonical(&p, &id, "tags emptied");
    update(&p, &id, |u| u.blocking = v(&[&other]));
    assert_canonical(&p, &id, "blocking add");
    update(&p, &id, |u| u.blocking = v(&[]));
    assert_canonical(&p, &id, "blocking remove");
    update(&p, &id, |u| u.blocked_by = v(&[&third]));
    assert_eq!(show(&p, &id)["blocked_by"], serde_json::json!([third]));
    assert_canonical(&p, &id, "blocked_by add");
    let base = show(&p, &id)["body"].as_str().unwrap().to_string();
    update(&p, &id, |u| {
        u.body = s("Rewritten body.\n");
        u.expect_body = Some(base);
    });
    assert_eq!(show(&p, &id)["body"].as_str().unwrap().trim(), "Rewritten body.");
    assert_canonical(&p, &id, "body");
    let before = show(&p, &id)["updated_at"].clone();
    std::thread::sleep(std::time::Duration::from_millis(1100));
    update(&p, &id, |_| {}); // Touch
    assert_ne!(show(&p, &id)["updated_at"], before, "touch did not bump updated_at");
    assert_canonical(&p, &id, "touch");
}

#[test]
fn t2_writes_never_add_legacy_keys_to_a_legacy_bean() {
    // A bean in the legacy shape (an `id:` key, quoted title, `tags: []`; 56 and 45
    // of the personal instance's files on 2026-10-20) comes out in the beans
    // format after a Beanstalk write: beans re-renders it, Beanstalk adds nothing.
    init();
    let p = project("t2l");
    let path = p.store.join("t2l-leg1--legacy.md");
    std::fs::write(
        &path,
        "---\nid: t2l-leg1\ntitle: \"Legacy bean\"\nstatus: todo\ntype: task\ntags: []\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n---\nLegacy body.\n",
    )
    .unwrap();
    update_bean_status(p.dir_str(), "t2l-leg1".into(), "in-progress".into()).unwrap();
    assert_canonical(&p, "t2l-leg1", "legacy bean after status");
}

#[test]
fn t2_beans_ext_block_survives_status_and_outside_body_edits() {
    init();
    let p = project("t2x");
    let body = format!("Intro paragraph.\n\n{EXT_BLOCK}\n\nTrailing notes.\n");
    let id = seed(&p, "Has ext", &[], Some(&body));
    let original = ext_block(&read(&file_of(&p, &id))).expect("seeded block present");

    update_bean_status(p.dir_str(), id.clone(), "in-progress".into()).unwrap();
    let after_status = read(&file_of(&p, &id));
    assert_eq!(ext_block(&after_status).as_deref(), Some(original.as_str()), "block changed by a status write:\n{after_status}");
    assert_canonical(&p, &id, "ext after status");

    let base = show(&p, &id)["body"].as_str().unwrap().to_string();
    let edited = base.replace("Intro paragraph.", "Intro paragraph, edited in beanstalk.");
    assert_ne!(edited, base, "fixture: the edit must change the body");
    update(&p, &id, |u| {
        u.body = Some(edited);
        u.expect_body = Some(base);
    });
    let after_body = read(&file_of(&p, &id));
    assert!(after_body.contains("edited in beanstalk"), "body edit not written");
    assert_eq!(ext_block(&after_body).as_deref(), Some(original.as_str()), "block changed by a body edit outside it:\n{after_body}");
    assert_canonical(&p, &id, "ext after body edit");
}

#[test]
fn t2_control_canonical_check_sees_a_hand_written_file() {
    // Negative control: a file in Beanstalk's old template shape fails the check.
    init();
    let p = project("t2n");
    let id = seed(&p, "Victim", &[], Some("Body.\n"));
    let path = file_of(&p, &id);
    let text = read(&path);
    std::fs::write(&path, text.replacen(&format!("# {id}\n"), &format!("# {id}\nid: {id}\n"), 1)).unwrap();
    let r = std::panic::catch_unwind(|| assert_canonical(&p, &id, "control"));
    assert!(r.is_err(), "assert_canonical accepted a file with an `id:` key");
}
