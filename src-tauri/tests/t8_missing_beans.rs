// T8 (P.-2jcn): with `beans_bin` pointing at a path that does not exist, reads
// report BEANS_UNAVAILABLE instead of showing data beans cannot vouch for,
// writes are refused and touch nothing, and the external editor still opens.
//
// Its own test binary: the Beanstalk config is process-wide, and here it names
// a missing binary and a stub editor (so no real editor is ever launched).

mod common;

use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use app_lib::commands::{create_bean, get_bean, get_beans, open_bean_in_editor, search_beans, update_bean_status};
use common::*;

fn missing_bin(home: &Path) -> PathBuf {
    home.join("no-such-dir").join("beans")
}

fn stub_editor(home: &Path) -> PathBuf {
    let stub = home.join("stub-editor");
    std::fs::write(&stub, format!("#!/bin/sh\nprintf '%s\\n' \"$@\" >> '{}'\n", home.join("editor.log").display())).unwrap();
    std::fs::set_permissions(&stub, std::fs::Permissions::from_mode(0o755)).unwrap();
    stub
}

fn h() -> &'static Harness {
    let h = init_with(Some(&missing_bin), Some(&stub_editor));
    assert!(!missing_bin(&h.home).exists(), "fixture: the configured beans must not exist");
    h
}

fn unavailable<T: std::fmt::Debug, E: std::fmt::Debug>(r: &Result<T, E>) -> bool {
    matches!(r, Err(e) if format!("{e:?}").contains("BEANS_UNAVAILABLE"))
}

#[test]
fn t8_list_reports_unavailable() {
    h();
    let p = project("t8l");
    seed(&p, "Present on disk", &[], None);
    let r = get_beans(p.dir_str());
    assert!(unavailable(&r), "get_beans without beans should report BEANS_UNAVAILABLE, got {r:?}");
}

#[test]
fn t8_detail_reports_unavailable() {
    h();
    let p = project("t8d");
    let id = seed(&p, "Present on disk", &[], None);
    let r = get_bean(p.dir_str(), id);
    assert!(unavailable(&r), "get_bean without beans should report BEANS_UNAVAILABLE, got {r:?}");
}

#[test]
fn t8_search_reports_unavailable() {
    h();
    let p = project("t8s");
    seed(&p, "Findable", &[], None);
    let r = search_beans(p.dir_str(), "Findable".into(), None, None, None);
    assert!(unavailable(&r), "search_beans without beans should report BEANS_UNAVAILABLE, got {r:?}");
}

#[test]
fn t8_create_is_refused_and_creates_nothing() {
    h();
    let p = project("t8c");
    // A beans project whose store has not been created yet.
    std::fs::remove_dir(&p.store).unwrap();
    let r = create_bean(p.dir_str(), "Never".into(), "todo".into(), "task".into(), None, Some(vec![]), None, None, None, None);
    assert!(!p.store.exists(), "create_bean without beans created {:?}", p.store);
    assert!(unavailable(&r), "create_bean without beans should report BEANS_UNAVAILABLE, got {r:?}");
}

#[test]
fn t8_update_is_refused_and_changes_nothing() {
    h();
    let p = project("t8u");
    let id = seed(&p, "Untouched", &[], Some("Body.\n"));
    let before = tree_state(&p.store);
    let r = update_bean_status(p.dir_str(), id, "completed".into());
    assert!(unavailable(&r), "update without beans should report BEANS_UNAVAILABLE, got {r:?}");
    assert_eq!(tree_state(&p.store), before, "the store changed although beans is unavailable");
}

#[test]
fn t8_external_editor_still_opens() {
    let h = h();
    let p = project("t8e");
    let id = seed(&p, "Edit me by hand", &[], None);
    let file = file_of(&p, &id);
    let stub = h.home.join("stub-editor");
    // Guard: if the stub were missing, Beanstalk would fall back to `open -a`.
    assert!(stub.is_file(), "stub editor missing at {stub:?}; refusing to launch a real one");

    open_bean_in_editor(p.dir_str(), id.clone()).unwrap_or_else(|e| panic!("open_bean_in_editor without beans: {e:?}"));

    let log = h.home.join("editor.log");
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        if let Ok(s) = std::fs::read_to_string(&log) {
            if s.lines().any(|l| Path::new(l) == file) {
                return;
            }
        }
        assert!(Instant::now() < deadline, "the editor was not launched on {file:?} within 5 s (log: {:?})", std::fs::read_to_string(&log).ok());
        std::thread::sleep(Duration::from_millis(50));
    }
}
