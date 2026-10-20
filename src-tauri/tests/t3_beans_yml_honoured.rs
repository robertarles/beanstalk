// T3 (P.-2jcn): Beanstalk honours the project's `.beans.yml`. A project whose
// config says `path: ../store` is listed, read, created into and updated in the
// store, and `<project>/.beans` never appears. A directory without `.beans.yml`
// is not a beans project.

mod common;

use app_lib::commands::{create_bean, get_bean, get_beans, update_bean_status};
use app_lib::config::commands::add_project;
use common::*;

fn ids(p: &Project) -> Vec<String> {
    let mut v: Vec<String> = flatten(&get_beans(p.dir_str()).unwrap_or_else(|e| panic!("get_beans: {e:?}")))
        .into_iter()
        .map(|b| b.id)
        .collect();
    v.sort();
    v
}

fn assert_no_project_dot_beans(p: &Project, step: &str) {
    // Control in the same place: the store directory is visible to the same check.
    assert!(p.store.is_dir(), "[{step}] control: store {:?} should exist", p.store);
    assert!(!p.dir.join(".beans").exists(), "[{step}] {:?} was created; beans keeps this project's data in {:?}", p.dir.join(".beans"), p.store);
}

#[test]
fn t3_list_reads_the_configured_store() {
    init();
    let p = project_with_central_store("t3l");
    let mut want = vec![seed(&p, "One", &[], None), seed(&p, "Two", &["--tag", "x"], Some("Body\n"))];
    want.sort();
    assert!(p.store.read_dir().unwrap().count() == 2, "fixture: beans wrote two files into the store");
    assert_eq!(ids(&p), want, "get_beans did not list the store's beans");
    assert_no_project_dot_beans(&p, "list");
}

#[test]
fn t3_get_bean_reads_the_configured_store() {
    init();
    let p = project_with_central_store("t3g");
    let id = seed(&p, "Detail me", &[], Some("Detail body\n"));
    let b = get_bean(p.dir_str(), id.clone()).unwrap_or_else(|e| panic!("get_bean {id}: {e:?}"));
    assert_eq!(b.title, "Detail me");
    assert_no_project_dot_beans(&p, "get");
}

#[test]
fn t3_create_goes_into_the_store() {
    init();
    let p = project_with_central_store("t3c");
    let r = create_bean(p.dir_str(), "Created here".into(), "todo".into(), "task".into(), None, Some(vec![]), None, Some("b\n".into()), None, None);
    // Whatever create returned, the project directory must not grow a store.
    assert_no_project_dot_beans(&p, "create");
    let bean = r.unwrap_or_else(|e| panic!("create_bean: {e:?}"));
    assert!(bean.id.starts_with(&p.prefix), "id {} does not use the project's prefix {}", bean.id, p.prefix);
    let in_store: Vec<_> = p.store.read_dir().unwrap().filter_map(|e| e.ok()).map(|e| e.file_name().to_string_lossy().into_owned()).collect();
    assert!(in_store.iter().any(|f| f.starts_with(&bean.id)), "created bean {} not in the store: {in_store:?}", bean.id);
}

#[test]
fn t3_update_writes_into_the_store() {
    init();
    let p = project_with_central_store("t3u");
    let id = seed(&p, "Update me", &[], None);
    let r = update_bean_status(p.dir_str(), id.clone(), "in-progress".into());
    assert_no_project_dot_beans(&p, "update");
    r.unwrap_or_else(|e| panic!("update_bean_status {id}: {e:?}"));
    assert_eq!(show(&p, &id)["status"], "in-progress");
}

#[test]
fn t3_add_project_accepts_a_central_store_project() {
    init();
    let p = project_with_central_store("t3a");
    seed(&p, "Exists", &[], None);
    let r = add_project(p.dir_str());
    assert!(r.is_ok(), "add_project refused a beans project whose store is elsewhere: {r:?}");
    assert_no_project_dot_beans(&p, "add_project");
}

#[test]
fn t3_add_project_refuses_a_directory_without_beans_yml() {
    init();
    let s = Scratch::new("t3n");
    // A bare `.beans/` with no `.beans.yml` is what the current check accepts.
    std::fs::create_dir_all(s.root.join(".beans")).unwrap();
    let r = add_project(s.root.to_string_lossy().into_owned());
    match r {
        Ok(_) => panic!("add_project accepted a directory with no .beans.yml"),
        Err(e) => assert!(e.to_lowercase().contains("not a beans project"), "refusal does not say \"not a beans project\": {e}"),
    }
}

#[test]
fn t3_create_without_beans_yml_creates_nothing() {
    init();
    let s = Scratch::new("t3z");
    let dir = s.root.join("plain");
    std::fs::create_dir_all(&dir).unwrap();
    let r = create_bean(dir.to_string_lossy().into_owned(), "Stray".into(), "todo".into(), "task".into(), None, Some(vec![]), None, None, None, None);
    let created: Vec<_> = walkdir::WalkDir::new(&s.root).into_iter().filter_map(|e| e.ok()).map(|e| e.path().to_path_buf()).filter(|p| p != &s.root && p != &dir).collect();
    assert!(created.is_empty(), "create_bean in a non-beans directory created {created:?} (result {r:?})");
    assert!(r.is_err(), "create_bean in a non-beans directory succeeded: {r:?}");
}
