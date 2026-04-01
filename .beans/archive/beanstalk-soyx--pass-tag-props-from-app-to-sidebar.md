---
# beanstalk-soyx
title: Pass tag props from App to Sidebar
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
---

Wire up tag-related props from App.tsx to Sidebar component

## Details

In `src/components/App.tsx`, update the Sidebar component invocation to pass the new tag-related props.

Implementation:
1. Locate the Sidebar component usage (around line 296)
2. Add three new props: `tagFilter`, `onTagFilter={setTagFilter}`, and `tags={availableTags}`
3. Ensure availableTags is derived from beans using the collectTags function

Pseudo-code:
```tsx
// Derive available tags (add after availableStatuses around line 163)
const availableStatuses = collectStatuses(beans);
const availableTags = collectTags(beans);

// Update Sidebar component (around line 296)
<Sidebar
  projects={config?.projects ?? []}
  activeProject={activeProject}
  onSelectProject={handleSelectProject}
  onAddProject={handleAddProject}
  onRemoveProject={handleRemoveProject}
  statusFilter={statusFilter}
  onStatusFilter={setStatusFilter}
  statuses={availableStatuses}
  tagFilter={tagFilter}           // Add
  onTagFilter={setTagFilter}      // Add
  tags={availableTags}            // Add
/>
```
