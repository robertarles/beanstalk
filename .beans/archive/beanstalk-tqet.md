---
# beanstalk
title: 'Fix: new beans may not be using the project .beans.yml'
status: completed
type: task
priority: high
created_at: 2026-04-10T16:49:25Z
updated_at: 2026-04-10T16:53:20Z
---

It appears that new beans may not be using the project .beans.yml file as newly created beans are not using the configured prefix (beans.prefix from the yaml file)

## Summary of Changes

- **BeansConfig** (beans/mod.rs): Added `prefix: Option<String>` and `id_length: Option<u32>` fields.
- **parse_beans_config** (beans/mod.rs): Updated to read from the nested `beans:` key in the YAML (the project-local format), falling back to top-level keys for compatibility. Now extracts `prefix` and `id_length`.
- **create_bean** (commands.rs): Reads the project config before generating the bean ID. Uses `config.prefix` (e.g. `beanstalk-`) + `config.id_length` characters (e.g. `4`) when set; falls back to the previous first-word-of-title slug when no prefix is configured.
- **random_suffix_n** / **base36_encode_n** (commands.rs): Renamed and updated to accept a length parameter instead of hard-coding 4 characters.
