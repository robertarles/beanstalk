// T7 (P.-2jcn), backend proxy: the active-list read Beanstalk does on every
// refresh (`get_beans`) has a median under 300 ms over 5 runs, on an instance
// the size of the personal one (about 400 active beans).
//
// This is not the design's T7, which is the median refresh measured inside the
// built app on terminus (debug log timing); that needs a GUI session and is NOT
// RUN here. The fixture also sits on the system temp dir (APFS), not on the
// gocryptfs mount the live instance is on, so this is a floor, not the in-app cost.

mod common;

use std::time::{Duration, Instant};

use app_lib::commands::get_beans;
use common::*;

const ACTIVE: usize = 420;
const ARCHIVED: usize = 220;
const THRESHOLD: Duration = Duration::from_millis(300);

fn fixture(p: &Project) {
    let body = "Some body text for a bean.\n\n## Section\n\n- a point\n- another point\n".repeat(8);
    for i in 0..ACTIVE + ARCHIVED {
        let id = format!("{}{:04}", p.prefix, i);
        let dir = if i < ACTIVE { p.store.clone() } else { p.store.join("archive") };
        std::fs::create_dir_all(&dir).unwrap();
        let parent = if i % 5 == 0 || i >= ACTIVE { String::new() } else { format!("parent: {}{:04}\n", p.prefix, i - i % 5) };
        let ty = if i % 5 == 0 { "epic" } else { "task" };
        std::fs::write(
            dir.join(format!("{id}--bean-number-{i}.md")),
            format!("---\n# {id}\ntitle: Bean number {i}\nstatus: todo\ntype: {ty}\npriority: normal\ntags:\n    - t{}\ncreated_at: 2026-01-01T00:00:00Z\nupdated_at: 2026-01-01T00:00:00Z\n{parent}---\n\n{body}", i % 7),
        )
        .unwrap();
    }
}

fn median_refresh(p: &Project) -> (Duration, Vec<Duration>, usize) {
    let mut times = Vec::new();
    let mut n = 0;
    for _ in 0..5 {
        let t = Instant::now();
        let tree = get_beans(p.dir_str()).unwrap_or_else(|e| panic!("get_beans: {e:?}"));
        times.push(t.elapsed());
        n = flatten(&tree).len();
    }
    let mut sorted = times.clone();
    sorted.sort();
    (sorted[2], times, n)
}

#[test]
fn t7_active_list_refresh_median_is_under_300ms() {
    init();
    let p = project("t7");
    fixture(&p);
    // Warm-up, as the app has already listed once before any refresh.
    let n = flatten(&get_beans(p.dir_str()).unwrap()).len();
    assert_eq!(n, ACTIVE, "fixture: the list should hold every active bean and no archived one");
    let (median, times, _) = median_refresh(&p);
    eprintln!("t7: get_beans over {ACTIVE} active beans: median {median:?}, runs {times:?}");
    assert!(median < THRESHOLD, "median refresh {median:?} is not under {THRESHOLD:?} (runs {times:?})");
}
