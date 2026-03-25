---
# beanstalk-vxr0
title: Implement parse_beans_config() for .beans.yml
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-bhh6
---

Create function to read and parse project configuration from .beans.yml file with sensible defaults

## Details

Implement parse_beans_config(project_path: PathBuf) -> Result<BeansConfig> in parser.rs. Look for .beans.yml in project root. Use serde_yaml to deserialize into BeansConfig struct. If file doesn't exist, return default config with project name from directory name and default statuses ['open', 'in-progress', 'done', 'archived']. Handle malformed YAML with clear error messages.
