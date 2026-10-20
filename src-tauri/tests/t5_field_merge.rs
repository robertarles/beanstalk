// T5 (P.-2jcn / P.-t4yv): a field edit in Beanstalk does not undo a concurrent
// change made outside it. The UI edits from what it showed when editing began;
// the external change lands between then and the save.
//
// Interface (team-lead's decision, 2026-10-20): a tag, blocking or blocked_by
// edit carries the list the edit started from, sent by the UI like expect_body:
// `update_bean(.., expect_body, expect_tags, expect_blocking, expect_blocked_by)`.
// The backend diffs the desired list against that base, so only the user's own
// adds and removes are sent. No backend snapshot decides the base.

mod common;

use app_lib::commands::{get_bean, get_beans, update_bean, update_bean_status};
use common::*;

fn list(p: &Project, id: &str, field: &str) -> Vec<String> {
    let mut v: Vec<String> = show(p, id)[field]
        .as_array()
        .map(|a| a.iter().map(|t| t.as_str().unwrap().to_string()).collect())
        .unwrap_or_default();
    v.sort();
    v
}

fn strings(items: &[&str]) -> Vec<String> {
    items.iter().map(|s| s.to_string()).collect()
}

/// A list edit as BeanDetail sends it: the desired list and its edit-start base.
fn save_lists(
    p: &Project,
    id: &str,
    tags: Option<(&[&str], &[&str])>,
    blocking: Option<(&[&str], &[&str])>,
    blocked_by: Option<(&[&str], &[&str])>,
) {
    let split = |x: Option<(&[&str], &[&str])>| match x {
        Some((want, base)) => (Some(strings(want)), Some(strings(base))),
        None => (None, None),
    };
    let (t, et) = split(tags);
    let (b, eb) = split(blocking);
    let (bb, ebb) = split(blocked_by);
    update_bean(p.dir_str(), id.into(), None, None, t, None, None, None, b, bb, None, et, eb, ebb)
        .unwrap_or_else(|e| panic!("update_bean {id}: {e:?}"));
}

#[test]
fn t5_status_change_keeps_an_external_body_append() {
    init();
    let p = project("t5a");
    let id = seed(&p, "Merge me", &[], Some("Original body.\n"));
    let _snapshot = get_bean(p.dir_str(), id.clone()).unwrap();

    beans(&p.dir, &["update", &id, "--body-append", "Appended by an agent.", "--json"], None);
    update_bean_status(p.dir_str(), id.clone(), "in-progress".into()).unwrap_or_else(|e| panic!("status: {e:?}"));

    let now = show(&p, &id);
    assert_eq!(now["status"], "in-progress", "status not written");
    let body = now["body"].as_str().unwrap();
    assert!(body.contains("Appended by an agent."), "the external append was lost: {body:?}");
    assert!(body.contains("Original body."), "the original body was lost: {body:?}");
}

#[test]
fn t5_title_change_keeps_an_external_priority_change() {
    init();
    let p = project("t5c");
    let id = seed(&p, "Old title", &[], None);
    let _snapshot = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "-p", "high", "--json"], None);
    update_bean(p.dir_str(), id.clone(), Some("New title".into()), None, None, None, None, None, None, None, None, None, None, None)
        .unwrap_or_else(|e| panic!("title: {e:?}"));
    let now = show(&p, &id);
    assert_eq!(now["title"], "New title");
    assert_eq!(now["priority"], "high", "the external priority change was lost");
}

#[test]
fn t5_tag_add_keeps_an_external_tag_add() {
    init();
    let p = project("t5b");
    let id = seed(&p, "Tag me", &["--tag", "base"], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--tag", "theirs", "--json"], None);
    save_lists(&p, &id, Some((&["base", "mine"], &["base"])), None, None);
    assert_eq!(list(&p, &id, "tags"), ["base", "mine", "theirs"], "a concurrent tag add was lost");
}

#[test]
fn t5_tag_remove_still_removes_and_keeps_an_external_add() {
    // Catches a fix that stops sending removes altogether.
    init();
    let p = project("t5r");
    let id = seed(&p, "Untag me", &["--tag", "base", "--tag", "drop"], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--tag", "theirs", "--json"], None);
    save_lists(&p, &id, Some((&["base"], &["base", "drop"])), None, None);
    assert_eq!(list(&p, &id, "tags"), ["base", "theirs"], "the user's remove or the external add went wrong");
}

#[test]
fn t5_refresh_during_the_edit_does_not_move_the_base() {
    // The case a backend snapshot gets wrong: the list is refreshed while the
    // edit is open (and again by the watcher after the external add), so a
    // snapshot of "what was last served" already contains the external tag, and
    // the user's stale list removes it. The edit's own base does not.
    init();
    let p = project("t5s");
    let id = seed(&p, "Refreshed mid-edit", &["--tag", "base"], None);
    let opened = get_bean(p.dir_str(), id.clone()).unwrap();
    let base: Vec<&str> = opened.tags.iter().map(|s| s.as_str()).collect();
    assert_eq!(base, ["base"], "fixture");

    get_beans(p.dir_str()).unwrap(); // list refresh while the editor is open
    beans(&p.dir, &["update", &id, "--tag", "theirs", "--json"], None);
    get_beans(p.dir_str()).unwrap(); // the watcher's refresh after the external add
    get_bean(p.dir_str(), id.clone()).unwrap(); // and the detail pane's

    save_lists(&p, &id, Some((&["base", "mine"], &base)), None, None);
    assert_eq!(list(&p, &id, "tags"), ["base", "mine", "theirs"], "the external tag was removed by a stale edit");
}

#[test]
fn t5_blocking_edit_keeps_an_external_blocking_add() {
    init();
    let p = project("t5k");
    let a = seed(&p, "A", &[], None);
    let b = seed(&p, "B", &[], None);
    let c = seed(&p, "C", &[], None);
    let id = seed(&p, "Blocks things", &["--blocking", &a], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--blocking", &b, "--json"], None);
    get_beans(p.dir_str()).unwrap();
    save_lists(&p, &id, None, Some((&[a.as_str(), c.as_str()], &[a.as_str()])), None);
    let mut want = vec![a.clone(), b.clone(), c.clone()];
    want.sort();
    assert_eq!(list(&p, &id, "blocking"), want, "a concurrent blocking add was lost");
}

#[test]
fn t5_blocked_by_edit_keeps_an_external_blocked_by_add() {
    init();
    let p = project("t5y");
    let a = seed(&p, "A", &[], None);
    let b = seed(&p, "B", &[], None);
    let c = seed(&p, "C", &[], None);
    let id = seed(&p, "Blocked", &["--blocked-by", &a, "--blocked-by", &c], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--blocked-by", &b, "--json"], None);
    get_beans(p.dir_str()).unwrap();
    // The user removes c; the external add of b must survive.
    save_lists(&p, &id, None, None, Some((&[a.as_str()], &[a.as_str(), c.as_str()])));
    let mut want = vec![a.clone(), b.clone()];
    want.sort();
    assert_eq!(list(&p, &id, "blocked_by"), want, "the user's remove or the external blocked_by add went wrong");
}

#[test]
fn t5_empty_tag_base_is_a_base_not_no_base() {
    // The edit started from a bean with no tags. An empty base must not be read
    // as "no base" (which falls back to a fresh read and removes the external add).
    init();
    let p = project("t5e");
    let id = seed(&p, "No tags yet", &[], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--tag", "theirs", "--json"], None);
    save_lists(&p, &id, Some((&["mine"], &[])), None, None);
    assert_eq!(list(&p, &id, "tags"), ["mine", "theirs"], "an empty tag base was treated as no base");
}

#[test]
fn t5_empty_blocking_base_is_a_base_not_no_base() {
    init();
    let p = project("t5f");
    let a = seed(&p, "A", &[], None);
    let b = seed(&p, "B", &[], None);
    let id = seed(&p, "Blocks nothing yet", &[], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--blocking", &a, "--json"], None);
    save_lists(&p, &id, None, Some((&[b.as_str()], &[])), None);
    let mut want = vec![a.clone(), b.clone()];
    want.sort();
    assert_eq!(list(&p, &id, "blocking"), want, "an empty blocking base was treated as no base");
}

#[test]
fn t5_empty_blocked_by_base_is_a_base_not_no_base() {
    init();
    let p = project("t5g");
    let a = seed(&p, "A", &[], None);
    let b = seed(&p, "B", &[], None);
    let id = seed(&p, "Blocked by nothing yet", &[], None);
    let _opened = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "--blocked-by", &a, "--json"], None);
    save_lists(&p, &id, None, None, Some((&[b.as_str()], &[])));
    let mut want = vec![a.clone(), b.clone()];
    want.sort();
    assert_eq!(list(&p, &id, "blocked_by"), want, "an empty blocked_by base was treated as no base");
}
