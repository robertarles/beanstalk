// T9 (P.-2jcn), backend half: a Beanstalk write causes one burst of filesystem
// events in the store (which the watcher's 500 ms debounce turns into one
// refresh), and the refresh itself writes nothing, so it cannot trigger another.
//
// The app-level count of `beans-changed` emissions needs a Tauri AppHandle and
// is NOT RUN here (tauri's `test` feature is not enabled in Cargo.toml).
//
// Events are observed with `notify` on the store, the same crate and backend
// (FSEvents on macOS) the watcher uses.

mod common;

use std::path::Path;
use std::sync::mpsc;
use std::time::{Duration, Instant};

use app_lib::commands::{get_bean, get_beans, search_beans, update_bean_status};
use app_lib::watcher::{is_watched_file, DEBOUNCE_MS};
use common::*;
use notify::{RecursiveMode, Watcher};

/// Relevant events (the watcher's own filter) seen within `window` after `act`,
/// as offsets from the first one.
fn events_during(store: &Path, act: impl FnOnce() + Send, window: Duration) -> Vec<Duration> {
    let (tx, rx) = mpsc::channel();
    let mut w = notify::RecommendedWatcher::new(tx, notify::Config::default()).unwrap();
    w.watch(store, RecursiveMode::Recursive).unwrap();
    // Let FSEvents settle so setup writes are not reported as ours.
    std::thread::sleep(Duration::from_millis(800));
    while rx.try_recv().is_ok() {}

    // The action runs on its own thread so events are timestamped as they
    // arrive. Receiving only after it returned would stamp a whole slow action's
    // events with one instant, and a second write 700 ms later would look like
    // part of the first burst.
    let end = Instant::now() + window;
    let mut seen = Vec::new();
    std::thread::scope(|scope| {
        scope.spawn(act);
        while let Some(left) = end.checked_duration_since(Instant::now()) {
            match rx.recv_timeout(left) {
                Ok(Ok(ev)) if ev.paths.iter().any(|p| is_watched_file(p)) => seen.push(Instant::now()),
                Ok(_) => {}
                Err(_) => break,
            }
        }
    });
    drop(w);
    let first = seen.first().copied();
    seen.into_iter().map(|t| t - first.unwrap()).collect()
}

#[test]
fn t9_refresh_reads_write_nothing() {
    init();
    let p = project("t9r");
    let id = seed(&p, "Watched", &["--tag", "x"], Some("Body.\n"));
    seed(&p, "Another", &[], None);
    let before = tree_state(&p.dir);
    let evs = events_during(
        &p.store,
        || {
            for _ in 0..3 {
                get_beans(p.dir_str()).unwrap();
                get_bean(p.dir_str(), id.clone()).unwrap();
                search_beans(p.dir_str(), "Watched".into(), None, None, None).unwrap();
            }
        },
        Duration::from_millis(1500),
    );
    assert!(evs.is_empty(), "a refresh produced {} watched filesystem event(s); each would trigger another refresh", evs.len());
    assert_eq!(tree_state(&p.dir), before, "a refresh changed files in the project");
}

#[test]
fn t9_one_write_is_one_debounce_window() {
    init();
    let p = project("t9w");
    let id = seed(&p, "Watched", &[], None);
    let evs = events_during(
        &p.store,
        || {
            update_bean_status(p.dir_str(), id.clone(), "in-progress".into()).unwrap();
        },
        Duration::from_millis(2500),
    );
    // Positive control: the observer sees a write.
    assert!(!evs.is_empty(), "no filesystem event observed for a write; the observer is blind");
    let spread = *evs.last().unwrap();
    assert!(
        spread < Duration::from_millis(DEBOUNCE_MS),
        "one write produced events spread over {spread:?}, more than the {DEBOUNCE_MS} ms debounce: the watcher would refresh more than once ({evs:?})"
    );
}
