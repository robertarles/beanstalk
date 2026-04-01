---
# beanstalk-6emn
title: Add integration tests for tag filtering feature
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:10
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
blocked_by:
    - beanstalk-a2a5
---

Create comprehensive tests for the complete tag filtering workflow

## Details

Create integration tests that verify the complete tag filtering feature works end-to-end.

Test file location: `src/test/components/TagFiltering.test.tsx` (new file)

Test cases to implement:
1. **Tag collection**: Verify collectTags correctly extracts unique tags from bean tree
2. **Sidebar rendering**: Tags section appears when tags exist, hidden when none
3. **Tag selection**: Clicking tags in sidebar updates filter state
4. **AND logic**: Multiple selected tags filter beans that have ALL tags
5. **Composition**: Tag filter works correctly with status filter
6. **Search composition**: Tag filter works with status and search filters
7. **Clear all**: 'All' button clears tag filter
8. **Project switching**: Tag filter resets when switching projects
9. **Scrolling**: Sidebar scrolls when content (including tags) exceeds height
10. **Tree preservation**: Beans with matching children are included even if parent doesn't match

Pseudo-code:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Tag Filtering', () => {
  it('should collect unique tags from bean tree', () => {
    const beans = createTestBeansWithTags();
    const tags = collectTags(beans);
    expect(tags).toEqual(['tag1', 'tag2', 'tag3'].sort());
  });
  
  it('should filter beans by single tag', () => {
    // Test implementation
  });
  
  it('should filter beans by multiple tags using AND logic', () => {
    const beans = [/* beans with various tags */];
    const filtered = filterByTags(beans, ['tag1', 'tag2']);
    // Verify only beans with BOTH tag1 AND tag2 are included
  });
  
  it('should compose tag filter with status filter', () => {
    // Test both filters working together
  });
  
  it('should reset tag filter when project changes', () => {
    // Test project switch resets tagFilter
  });
  
  // ... additional test cases
});
```
