---
# beanstalk-pxoi
title: Add tagFilter prop to BeanList component
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:7
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
blocked_by:
    - beanstalk-vzg7
---

Update BeanList component interface to accept tagFilter prop

## Details

In `src/components/BeanList.tsx`, update the BeanListProps interface and component to accept the tagFilter prop.

Implementation:
1. Add to BeanListProps interface (around line 4): `tagFilter?: string[];`
2. Add to component destructuring (line 140): include `tagFilter = []` with default
3. This mirrors the existing statusFilter pattern

Pseudo-code:
```typescript
interface BeanListProps {
  beans: Bean[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  statusFilter?: string[];
  tagFilter?: string[];  // Add this line
  onNewBean?: () => void;
  // ... rest of props
}

export const BeanList = memo(function BeanList({ 
  beans, 
  selectedId, 
  onSelect, 
  loading, 
  statusFilter = [], 
  tagFilter = [],  // Add this line
  onNewBean,
  // ... rest of destructured props
}: BeanListProps) {
  // Component implementation
});
```
