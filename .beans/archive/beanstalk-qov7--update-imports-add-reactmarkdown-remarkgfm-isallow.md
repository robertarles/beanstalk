---
# beanstalk-qov7
title: 'Update imports: add ReactMarkdown, remarkGfm, isAllowedUrl; remove parseBodyWithLinks'
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:13:03Z
parent: beanstalk-h23q
---

Modify the import statements at the top of BeanDetail.tsx to add the new markdown rendering dependencies and remove the deprecated parsing function.

## Details

At the top of src/components/BeanDetail.tsx:
1. Add: import ReactMarkdown from 'react-markdown'
2. Add: import remarkGfm from 'remark-gfm'
3. Add: import { isAllowedUrl } from '../lib/markdown'
4. Remove: the parseBodyWithLinks import (no longer needed)

Ensure all imports are organized cleanly. This prepares the file for the ReactMarkdown implementation without breaking existing functionality until the next steps are complete.

## Summary of Changes\n\nUpdated imports in BeanDetail.tsx: added ReactMarkdown, remarkGfm, isAllowedUrl; removed parseBodyWithLinks.
