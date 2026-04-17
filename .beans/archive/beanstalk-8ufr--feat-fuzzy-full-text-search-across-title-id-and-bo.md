---
# beanstalk-8ufr
title: 'Feat: fuzzy full-text search across title, id, and body'
status: completed
type: feature
priority: normal
created_at: 2026-04-10T21:43:53Z
updated_at: 2026-04-10T21:45:06Z
---

Extend the BeanList search to cover all bean fields and add fuzzy matching via fuse.js.\n\n- [x] npm install fuse.js\n- [ ] Replace the current substring filter in BeanList with a Fuse instance\n- [ ] Index title, id, and body fields; weight title > id > body\n- [ ] Keep the 300ms debounce; rebuild Fuse index when the bean list changes\n- [ ] Tune threshold so body fuzzy results are not too noisy

## Summary of Changes

- Installed fuse.js 7.3.0
- In BeanList.tsx: flattens the post-filter tree into a flat list for Fuse indexing; rebuilds the Fuse index whenever the filtered list changes
- Fuse keys: title (weight 3), id (weight 2), body (weight 1); threshold 0.35 with ignoreLocation so body matches anywhere in the text
- Search result is a Set of matched IDs; the tree is then recursively filtered keeping any bean whose ID is in the set or that has a matching descendant
- 300ms debounce unchanged
