---
# beanstalk-kr36
title: Apply tagFilter in BeanList filtering chain
status: completed
type: task
priority: normal
created_at: 2026-04-01T17:00:03Z
updated_at: 2026-04-01T17:05:41Z
parent: beanstalk-ghh8
---

Add tagFilter prop to BeanListProps. Insert a tagFiltered useMemo step between statusFiltered and the search filter, calling filterByTags(statusFiltered, tagFilter). Update the search useMemo and total count to use tagFiltered as input. Files: src/components/BeanList.tsx
