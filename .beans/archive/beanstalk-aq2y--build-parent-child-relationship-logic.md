---
# beanstalk-aq2y
title: Build parent-child relationship logic
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:29:43Z
parent: beanstalk-bhh6
---

Implement tree-building algorithm to establish parent-child relationships between beans based on directory structure or metadata

## Details

Enhance scan_beans_directory() or create build_bean_tree(beans: Vec<Bean>) -> Vec<Bean> function. Strategy: if bean file is in subdirectory of another bean's directory, or if metadata contains parent_id field, establish parent-child link. Build HashMap<String, Bean> by ID for quick lookups. Iterate through beans, identify parent by directory path or parent_id metadata, and add to parent's children vector. Return only root-level beans (those without parents). Handle orphaned beans (parent_id references non-existent bean) by treating as root-level with warning.
