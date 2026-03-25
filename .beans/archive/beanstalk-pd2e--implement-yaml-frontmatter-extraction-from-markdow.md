---
# beanstalk-pd2e
title: Implement YAML frontmatter extraction from markdown files
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:29:43Z
parent: beanstalk-bhh6
---

Add functionality to extract YAML metadata block from the beginning of markdown files using regex or a frontmatter parsing crate

## Details

Add dependencies (gray_matter or similar frontmatter parser, or use regex with yaml-rust). Implement extract_frontmatter(content: &str) -> Result<(HashMap<String, Value>, String)> that splits markdown content into YAML metadata and body. Handle files with and without frontmatter delimiters (---). Return parsed YAML as a map and remaining content as body string.
