// T5 (P.-2jcn): a field edit in Beanstalk does not undo a concurrent change made
// outside it. The UI edits from a snapshot taken when the bean was opened; the
// external change lands between that snapshot and the save.

mod common;

use app_lib::commands::{get_bean, update_bean, update_bean_status};
use common::*;

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
fn t5_tag_add_keeps_an_external_tag_add() {
    init();
    let p = project("t5b");
    let id = seed(&p, "Tag me", &["--tag", "base"], None);
    let snapshot = get_bean(p.dir_str(), id.clone()).unwrap();

    beans(&p.dir, &["update", &id, "--tag", "theirs", "--json"], None);

    // What BeanDetail sends: the tag list as edited from the snapshot.
    let mut desired = snapshot.tags.clone();
    desired.push("mine".into());
    update_bean(p.dir_str(), id.clone(), None, None, Some(desired), None, None, None, None, None, None)
        .unwrap_or_else(|e| panic!("tags: {e:?}"));

    let mut tags: Vec<String> = show(&p, &id)["tags"].as_array().unwrap().iter().map(|t| t.as_str().unwrap().to_string()).collect();
    tags.sort();
    assert_eq!(tags, vec!["base", "mine", "theirs"], "a concurrent tag change was lost");
}

#[test]
fn t5_title_change_keeps_an_external_priority_change() {
    init();
    let p = project("t5c");
    let id = seed(&p, "Old title", &[], None);
    let _snapshot = get_bean(p.dir_str(), id.clone()).unwrap();
    beans(&p.dir, &["update", &id, "-p", "high", "--json"], None);
    update_bean(p.dir_str(), id.clone(), Some("New title".into()), None, None, None, None, None, None, None, None)
        .unwrap_or_else(|e| panic!("title: {e:?}"));
    let now = show(&p, &id);
    assert_eq!(now["title"], "New title");
    assert_eq!(now["priority"], "high", "the external priority change was lost");
}
