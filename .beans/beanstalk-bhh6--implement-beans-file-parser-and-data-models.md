---
# beanstalk-bhh6
title: Implement beans file parser and data models
status: todo
type: epic
priority: high
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-ut4w
---

Create Rust modules to parse .beans.yml config and individual bean markdown files into structured data

## Details

1. Create `src-tauri/src/beans/mod.rs` module structure:
   - `models.rs` - data structures
   - `parser.rs` - markdown and YAML parsing
   - `scanner.rs` - directory scanning
2. Define Bean struct:
```rust
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Bean {
    pub id: String,
    pub title: String,
    pub status: String,
    pub created: DateTime<Utc>,
    pub tags: Vec<String>,
    pub assignee: Option<String>,
    pub body: String,
    pub file_path: PathBuf,
    pub parent_id: Option<String>,
    pub children: Vec<Bean>,
}
```
3. Define BeansConfig struct for .beans.yml:
```rust
#[derive(Deserialize)]
pub struct BeansConfig {
    pub name: String,
    pub statuses: Option<Vec<String>>,
}
```
4. Implement parse_bean_file(path: PathBuf) -> Result<Bean>:
   - Use regex or frontmatter parser to extract YAML metadata
   - Parse created date with chrono
   - Extract body markdown (content after metadata)
   - Parse ID from filename or metadata
5. Implement parse_beans_config(project_path: PathBuf) -> Result<BeansConfig>
6. Implement scan_beans_directory(project_path: PathBuf) -> Result<Vec<Bean>>:
   - Use walkdir to recursively find all .md files in .beans/
   - Build parent-child relationships based on directory structure or metadata
   - Sort by created date descending by default
7. Handle malformed files gracefully with error logging
