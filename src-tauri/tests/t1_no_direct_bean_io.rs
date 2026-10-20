// T1 (P.-2jcn): Beanstalk never writes bean data itself, never reads bean files
// with its own parser, and never overrides where beans keeps its data.
//
// A static check over `src-tauri/src`, outside `config/` (Beanstalk's own
// config.json) and `appearance.rs`, and outside `#[cfg(test)]` code.

use std::path::{Path, PathBuf};

/// Direct filesystem writes (design T1).
const WRITE_PATTERNS: &[&str] = &["fs::write", "fs::rename", "fs::remove", "File::create", "OpenOptions", "create_dir"];

/// Direct reads of bean files (design T1, "after C").
const READ_PATTERNS: &[&str] = &["WalkDir", "read_to_string"];

/// Functions allowed to call `read_to_string`: the `.beans.yml` prefix read is
/// config, not bean data, and whether to keep it is an open question (design A8).
const READ_ALLOWED_IN_FNS: &[&str] = &["parse_beans_config"];

fn src_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("src")
}

fn excluded(rel: &Path) -> bool {
    rel.starts_with("config") || rel == Path::new("appearance.rs")
}

/// Non-test source: everything before the first `#[cfg(test)]`, with `//`
/// comments blanked. Test modules sit at the end of every file in this crate;
/// `test_modules_are_trailing` keeps that assumption honest.
fn production_lines(text: &str) -> Vec<(usize, String)> {
    let mut out = Vec::new();
    for (i, line) in text.lines().enumerate() {
        if line.trim_start().starts_with("#[cfg(test)]") {
            break;
        }
        let code = match line.find("//") {
            Some(pos) => &line[..pos],
            None => line,
        };
        out.push((i + 1, code.to_string()));
    }
    out
}

/// Name of the innermost `fn` declared at or above `idx` in `lines`.
fn enclosing_fn(lines: &[(usize, String)], idx: usize) -> String {
    for (_, l) in lines[..=idx].iter().rev() {
        if let Some(pos) = l.find("fn ") {
            let name: String = l[pos + 3..].chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
            if !name.is_empty() {
                return name;
            }
        }
    }
    String::new()
}

fn rust_files() -> Vec<(PathBuf, String)> {
    let root = src_dir();
    let mut files: Vec<(PathBuf, String)> = walkdir::WalkDir::new(&root)
        .sort_by_file_name()
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|x| x.to_str()) == Some("rs"))
        .map(|e| {
            let rel = e.path().strip_prefix(&root).unwrap().to_path_buf();
            (rel, std::fs::read_to_string(e.path()).unwrap())
        })
        .collect();
    files.sort();
    files
}

/// Hits of `patterns` in production code, as `file:line: text`.
fn scan(patterns: &[&str], allow_fns: &[&str]) -> Vec<String> {
    let mut hits = Vec::new();
    for (rel, text) in rust_files() {
        if excluded(&rel) {
            continue;
        }
        let lines = production_lines(&text);
        for (idx, (n, code)) in lines.iter().enumerate() {
            for p in patterns {
                if code.contains(p) && !allow_fns.contains(&enclosing_fn(&lines, idx).as_str()) {
                    hits.push(format!("{}:{}: {}", rel.display(), n, code.trim()));
                }
            }
        }
    }
    hits
}

#[test]
fn t1_no_direct_writes_to_bean_data() {
    let hits = scan(WRITE_PATTERNS, &[]);
    assert!(hits.is_empty(), "direct filesystem writes outside config/ and appearance.rs:\n{}", hits.join("\n"));
}

#[test]
fn t1_no_direct_reads_of_bean_files() {
    let hits = scan(READ_PATTERNS, READ_ALLOWED_IN_FNS);
    assert!(hits.is_empty(), "bean files read directly instead of through beans:\n{}", hits.join("\n"));
}

#[test]
fn t1_no_beans_path_override() {
    // Forcing the data directory ignores `path:` in the project's .beans.yml (A4).
    let hits = scan(&["\"--beans-path\""], &[]);
    assert!(hits.is_empty(), "`--beans-path` forced in production code:\n{}", hits.join("\n"));
}

// ── Controls: the scanner can see what it is looking for ──────────────────────

#[test]
fn t1_control_scanner_sees_production_code() {
    // Positive control: a pattern known to be in production code is found, so an
    // empty result above means absent, not "scanned nothing".
    let hits = scan(&["Command::new"], &[]);
    assert!(hits.iter().any(|h| h.starts_with("beanscli.rs:")), "scanner found no `Command::new` in beanscli.rs: {hits:?}");
    assert!(rust_files().len() >= 8, "expected the crate's source files, found {}", rust_files().len());
}

#[test]
fn t1_control_patterns_match_real_shapes() {
    let sample = "    std::fs::create_dir_all(&d)?;\n    let f = std::fs::File::create(p)?;\n    let o = OpenOptions::new();\n    std::fs::write(p, b)?;\n    std::fs::rename(a, b)?;\n    std::fs::remove_file(a)?;\n    for e in WalkDir::new(d) {}\n    let s = std::fs::read_to_string(p)?;\n";
    let lines = production_lines(sample);
    for p in WRITE_PATTERNS.iter().chain(READ_PATTERNS) {
        assert!(lines.iter().any(|(_, l)| l.contains(p)), "pattern {p} matches nothing in the sample");
    }
}

#[test]
fn t1_control_test_code_and_comments_are_excluded() {
    // commands.rs has `fs::remove_dir_all` in its test module and a doc comment
    // above `run_beans` mentions `--beans-path`; neither may count.
    let text = std::fs::read_to_string(src_dir().join("commands.rs")).unwrap();
    assert!(text.contains("fs::remove_dir_all"), "fixture assumption: commands.rs tests use remove_dir_all");
    let prod = production_lines(&text);
    assert!(!prod.iter().any(|(_, l)| l.contains("fs::remove_dir_all")), "test-module code leaked into the scan");
    let commented = production_lines("// fs::write(x)\nlet a = 1; // File::create\n");
    assert!(!commented.iter().any(|(_, l)| l.contains("fs::write") || l.contains("File::create")));
}

#[test]
fn t1_control_test_modules_are_trailing() {
    // The scan stops at the first `#[cfg(test)]`. If production code followed a
    // test module it would be skipped; refuse that layout. After the first
    // `#[cfg(test)]`, every top-level line must open or close a test module.
    for (rel, text) in rust_files() {
        let lines: Vec<&str> = text.lines().collect();
        let Some(start) = lines.iter().position(|l| l.trim_start().starts_with("#[cfg(test)]")) else { continue };
        let mut depth = 0i32;
        let mut prev_top = "";
        for (i, l) in lines.iter().enumerate().skip(start) {
            let code = l.split("//").next().unwrap_or("");
            if depth == 0 && !code.trim().is_empty() {
                let t = code.trim_start();
                let ok = t.starts_with("#[cfg(test)]") || (t.starts_with("mod ") && prev_top.starts_with("#[cfg(test)]"));
                assert!(ok, "{}:{}: production code after a test module: {}", rel.display(), i + 1, l.trim());
                prev_top = t;
            }
            depth += code.matches('{').count() as i32 - code.matches('}').count() as i32;
        }
    }
}
