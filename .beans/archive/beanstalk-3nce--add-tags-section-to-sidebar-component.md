---
# beanstalk-3nce
title: Add Tags section to Sidebar component
status: scrapped
type: epic
priority: high
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
---

Add Tags filter UI section to Sidebar below Status section with matching styling

## Details

In `src/components/Sidebar.tsx`, add a new Tags section that mirrors the Status section's UX.

Implementation:
1. Add props to SidebarProps interface:
   - `tagFilter: string[]`
   - `onTagFilter: (tags: string[]) => void`
   - `tags: string[]` (available tags from the active project)
2. Add Tags section after Status section, preceded by a divider matching line 125
3. Use identical styling to Status section (lines 128-180)
4. Section header: "TAGS" with "All" clear button when tagFilter.length > 0
5. Each tag renders as a toggleable button with checkbox indicator
6. Hide entire Tags section when `tags.length === 0`

Pseudo-code:
```tsx
{/* Tags filter section - only show if tags exist */}
{tags.length > 0 && (
  <>
    {/* Divider */}
    <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-800" />
    
    <div className="px-3 pb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Tags
        </span>
        {tagFilter.length > 0 && (
          <button
            onClick={() => onTagFilter([])}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
          >
            All
          </button>
        )}
      </div>
      
      <ul className="space-y-0.5">
        {tags.map((tag) => {
          const isActive = tagFilter.includes(tag);
          return (
            <li key={tag}>
              <button
                onClick={() => {
                  if (isActive) {
                    onTagFilter(tagFilter.filter((t) => t !== tag));
                  } else {
                    onTagFilter([...tagFilter, tag]);
                  }
                }}
                className={/* same as status button */}
              >
                {/* Checkbox indicator */}
                <span className={/* same as status checkbox */}>
                  {isActive && '✓'}
                </span>
                {tag}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  </>
)}
```
