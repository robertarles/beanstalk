// T4 (P.-2jcn), backend half: a body save based on a body that has since changed
// on disk is refused with CONFLICT and leaves the file byte-for-byte unchanged.
// The frontend half (typed text kept) is src/test/components/BeanDetailBodyConflict.test.tsx.

mod common;

use app_lib::commands::{get_bean, update_bean};
use common::*;

fn save_body(p: &Project, id: &str, body: &str, base: &str) -> Result<app_lib::beans::Bean, app_lib::beanscli::BeansCliError> {
    update_bean(p.dir_str(), id.into(), None, None, None, Some(body.into()), None, None, None, None, Some(base.into()))
}

#[test]
fn t4_save_over_an_external_body_change_is_refused_and_writes_nothing() {
    init();
    let p = project("t4a");
    let id = seed(&p, "Conflicted", &[], Some("Base body.\n"));
    let base = get_bean(p.dir_str(), id.clone()).unwrap().body;

    // Someone else rewrites the body through beans while the edit is open.
    beans(&p.dir, &["update", &id, "-d", "-", "--json"], Some("Their body.\n"));
    let file = file_of(&p, &id);
    let before = bytes(&file);

    let err = save_body(&p, &id, "My careful edit.\n", &base).expect_err("save over a changed body succeeded");
    assert_eq!(err.code, "CONFLICT", "wrong error: {err:?}");
    assert_eq!(bytes(&file), before, "the file changed although the save was refused");
    assert!(read(&file).contains("Their body."), "the external change was lost");
}

#[test]
fn t4_save_over_an_appended_ext_block_is_refused() {
    // The bext shape: an append through beans (`--body-append`), not a rewrite.
    init();
    let p = project("t4b");
    let id = seed(&p, "Ext appended", &[], Some("Base body.\n"));
    let base = get_bean(p.dir_str(), id.clone()).unwrap().body;
    beans(&p.dir, &["update", &id, "--body-append", "-", "--json"], Some(EXT_BLOCK));
    let file = file_of(&p, &id);
    let before = bytes(&file);

    let err = save_body(&p, &id, "Base body, edited.\n", &base).expect_err("save over an appended block succeeded");
    assert_eq!(err.code, "CONFLICT", "wrong error: {err:?}");
    assert_eq!(bytes(&file), before, "the file changed although the save was refused");
    assert!(ext_block(&read(&file)).is_some(), "the appended block was lost");
}

#[test]
fn t4_control_save_on_an_unchanged_body_succeeds() {
    // Positive control: the guard does not refuse everything.
    init();
    let p = project("t4c");
    let id = seed(&p, "Unconflicted", &[], Some("Base body.\n"));
    let base = get_bean(p.dir_str(), id.clone()).unwrap().body;
    save_body(&p, &id, "My careful edit.\n", &base).unwrap_or_else(|e| panic!("save on an unchanged body failed: {e:?}"));
    assert!(read(&file_of(&p, &id)).contains("My careful edit."));
}
