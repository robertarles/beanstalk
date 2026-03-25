---
# beanstalk-ibdp
title: Build bean list display with filtering and sorting
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:8
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:38:11Z
parent: beanstalk-ut4w
---

Implement bean list rendering with status filtering, search, and multi-column sorting capabilities

## Details

1. Create useBeans custom hook:
```typescript
const useBeans = (projectPath: string | null) => {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [selectedBean, setSelectedBean] = useState<Bean | null>(null);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'title'>('date');
  
  const loadBeans = async () => {
    if (!projectPath) return;
    const result = await invoke('get_beans', { projectPath });
    setBeans(result);
  };
  
  const filteredBeans = useMemo(() => {
    return beans
      .filter(b => filter.status === 'all' || b.status === filter.status)
      .filter(b => filter.search === '' || 
        b.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        b.body.toLowerCase().includes(filter.search.toLowerCase())
      )
      .sort((a, b) => sortBy === 'date' ? b.created - a.created : a[sortBy].localeCompare(b[sortBy]));
  }, [beans, filter, sortBy]);
  
  return { beans: filteredBeans, selectedBean, setSelectedBean, loadBeans, setFilter, setSortBy };
};
```
2. Implement BeanList table component:
   - Columns: status icon, title, ID, created date
   - Clickable column headers for sorting (show sort direction indicator)
   - Row click selects bean and updates detail pane
   - Highlight selected row
   - Show children beans as nested/indented rows (collapsible)
3. Implement search bar:
   - Real-time filtering as user types
   - Search debouncing (300ms) for performance
   - Clear button when search has text
4. Implement status filter in sidebar:
   - Get unique statuses from beans + .beans.yml config
   - "All" option shows everything
   - Show count badge next to each status
5. Implement expandable children:
   - Chevron icon to expand/collapse children
   - Maintain expand state in component state
   - Indent child beans visually
6. Handle empty states: no beans, no matching search results
