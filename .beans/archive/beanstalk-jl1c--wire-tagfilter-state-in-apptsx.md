---
# beanstalk-jl1c
title: Wire tagFilter state in App.tsx
status: completed
type: task
priority: normal
created_at: 2026-04-01T16:34:54Z
updated_at: 2026-04-01T17:05:41Z
parent: beanstalk-ghh8
---

Add tagFilter state (useState<string[]>([])), derive availableTags via collectTags(beans) with useMemo, reset tagFilter when activeProject changes (alongside statusFilter reset). Pass tagFilter/setTagFilter/availableTags to Sidebar and tagFilter to BeanList. Files: src/App.tsx
