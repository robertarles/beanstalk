---
# beanstalk-a2a5
title: Pass tagFilter prop from App to BeanList
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:9
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
blocked_by:
    - beanstalk-yvsg
---

Wire tagFilter from App state to BeanList component

## Details

In `src/components/App.tsx`, update the BeanList component invocation to pass the tagFilter prop.

Implementation:
1. Locate BeanList component usage (around line 308)
2. Add `tagFilter={tagFilter}` prop

Pseudo-code:
```tsx
<BeanList
  beans={beans}
  selectedId={selectedBeanId}
  onSelect={(id) => {
    setSelectedBeanId(id);
    setIsCreating(false);
  }}
  loading={beansLoading}
  statusFilter={statusFilter}
  tagFilter={tagFilter}  // Add this line
  lastRefreshed={lastRefreshed}
  onNewBean={() => {
    setIsCreating(true);
    setSelectedBeanId(null);
  }}
  keyboardSelectedIndex={selectedBeanIndex >= 0 ? selectedBeanIndex : undefined}
  onFlatListChange={handleFlatListChange}
  registerEscapeHandler={registerEscapeHandler}
/>
```
