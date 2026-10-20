// T9/T3 (P.-2jcn, audit A9): the watcher watches where beans keeps the data,
// which for a project with `path: ../store` is the store, not `<project>/.beans`.
//
// Uses `app_lib::watcher::beans_watch_path`, the helper the watcher's own unit
// tests use. Its own test binary, so a change to that helper's signature breaks
// only this file.

mod common;

use app_lib::watcher::beans_watch_path;
use common::*;

#[test]
fn t9_watch_path_follows_beans_yml() {
    init();
    let p = project_with_central_store("t9p");
    let got = beans_watch_path(&p.dir);
    let got = got.canonicalize().unwrap_or(got);
    assert_eq!(got, p.store, "the watcher would watch {got:?}, but beans keeps this project's data in {:?}", p.store);
}

#[test]
fn t9_watch_path_default_store_is_dot_beans() {
    // Control: a default project still watches `<project>/.beans`.
    init();
    let p = project("t9d");
    let got = beans_watch_path(&p.dir);
    assert_eq!(got.canonicalize().unwrap_or(got), p.store);
}
