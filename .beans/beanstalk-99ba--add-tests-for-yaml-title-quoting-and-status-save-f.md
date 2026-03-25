---
# beanstalk-99ba
title: Add tests for YAML title quoting and status save fixes
status: completed
type: task
priority: normal
created_at: 2026-03-25T21:29:32Z
updated_at: 2026-03-25T21:31:32Z
---

Write tests covering the two bugs fixed in beanstalk-e5ce: (1) yaml_quote_str helper and title quoting in update_bean/create_bean (Rust); (2) updateBean passing status from edit form (frontend).

## Summary of Changes

Added the following tests:

**Rust (src-tauri/src/commands.rs)**
- `test_yaml_quote_str_plain` — basic quoting
- `test_yaml_quote_str_with_hash` — hash (YAML comment marker) roundtrip
- `test_yaml_quote_str_leading_hash` — title starting with '#'
- `test_yaml_quote_str_with_brackets` — title starting with '[' (YAML sequence)
- `test_yaml_quote_str_with_colon` — colon in title
- `test_yaml_quote_str_with_double_quote` — escaped double-quote
- `test_yaml_quote_str_with_backslash` — escaped backslash
- `test_create_bean_title_with_special_chars_roundtrips` — create round-trip with special chars
- `test_update_bean_title_with_special_chars_roundtrips` — update round-trip with special chars
- `test_update_bean_status_preserves_special_char_title` — status change preserves special-char title

Also updated two pre-existing tests that checked for unquoted title format to match the new double-quoted format.

**Frontend (src/test/components/BeanDetail.test.tsx)**
- `save calls onSave with the current status (status field included)` — verifies status is passed to onSave when changed in edit mode
- `save preserves original status when status is not changed` — verifies original status is preserved
