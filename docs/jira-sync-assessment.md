# Assessment: Syncing beans issues with Jira stories

Tracking bean: `beanstalk-x2k1` — *"Can beans-issues be safely sync'd with jira stories?"*

## Summary

A one-way or two-way sync between beans and Jira is **technically viable but carries
real correctness risks**. A **one-way push (beans → Jira)** is safe and low-effort and
is the recommended first step. A **bidirectional sync is feasible but should be treated
as a separate, larger project** because of identity mapping, conflict resolution, and
field-model mismatches. "Safely" is the operative word: without an explicit ID mapping
and conflict strategy, a naive two-way sync will eventually duplicate or clobber data.

## What beans stores (the source model)

Beans are Markdown files under `.beans/` with YAML frontmatter. The parsed model
(`src/types/beans.ts`, `src-tauri/src/beans/mod.rs`) is:

| beans field    | notes |
| -------------- | ----- |
| `id`           | e.g. `beanstalk-x2k1`; prefix + short id from `.beans.yml` |
| `title`        | free text |
| `status`       | project-configurable (`todo`, `in-progress`, `draft`, `completed`, `scrapped`, `archived`) |
| `bean_type`    | `milestone`, `epic`, `bug`, `feature`, `task` |
| `parent`       | single parent id → hierarchy |
| `tags`         | string list |
| `priority`     | `critical`/`high`/`normal`/`low`/`deferred` or none |
| `assignee`     | free text |
| `created_at` / `updated_at` | ISO timestamps |
| `body`         | Markdown |
| `blocking` / `blocked_by` | issue-link lists |

Archived beans live under `.beans/archive/` and are intentionally excluded from the
active set (see `scan_beans_directory`, beanstalk-z25z).

## Mapping to Jira

Most fields map cleanly; the mismatches are where the risk lives.

| beans          | Jira | mapping risk |
| -------------- | ---- | ------------ |
| `title`        | Summary | clean |
| `body` (Markdown) | Description (ADF / wiki markup) | **lossy** — Jira Cloud uses Atlassian Document Format, not Markdown; round-tripping mangles formatting |
| `status`       | Status (workflow) | **needs a mapping table**; Jira statuses are workflow-scoped and transitions are gated |
| `bean_type`    | Issue type | `milestone`/`epic` → Epic; `bug`→Bug; `feature`/`task`→Story/Task |
| `priority`     | Priority | needs a value map (`deferred` has no default Jira equivalent) |
| `parent`       | Epic Link / parent | Jira restricts parent by issue-type hierarchy level; a task-under-task may be rejected |
| `tags`         | Labels | Jira labels disallow spaces |
| `assignee`     | Assignee | **identity mapping required** (Jira accountId, not a name string) |
| `blocking`/`blocked_by` | Issue links (`blocks`/`is blocked by`) | clean once both issues exist |
| `id`           | — | store the Jira key in bean frontmatter; store the bean id in a Jira custom field or label |

## The core safety problem: identity + conflicts

1. **Stable identity mapping.** Each bean must remember its Jira key and vice-versa.
   Recommended: add `jira_key:` to bean frontmatter and a `beans-id` label/custom-field
   on the Jira issue. Without this, re-runs create duplicates.
2. **Change detection.** `updated_at` exists on beans and Jira exposes `updated`. A safe
   sync compares both against the last-synced watermark rather than blindly overwriting.
3. **Conflict resolution.** If both sides changed since the last sync, you need a policy
   (last-writer-wins, source-of-truth-wins, or flag-for-manual). Two-way sync without
   this *will* silently lose edits.
4. **Field authority.** Decide per field who owns it. A common safe split: beans owns
   `title`/`body`/`type`/`parent`; Jira owns `status`/`assignee` (or vice-versa).

## Recommendation

- **Phase 1 (safe, recommended): one-way beans → Jira push.** Create/update Jira issues
  from beans, writing `jira_key` back into frontmatter for idempotency. No conflict
  logic needed because Jira is treated as a read-only mirror. Low risk.
- **Phase 2 (optional): pull Jira status/assignee back** into beans as the only two
  Jira-owned fields. Narrow surface, easy conflict story.
- **Phase 3 (large, separate project): full bidirectional sync** with a watermark,
  per-field authority, and conflict flagging. Only pursue if there is a concrete need
  for editing in both systems.

### Effort / risk

| Option | Effort | Safety |
| ------ | ------ | ------ |
| One-way push | Low | Safe |
| Push + status/assignee pull | Medium | Safe with a small mapping table |
| Full bidirectional | High | Risky without watermark + conflict policy |

### Prerequisites regardless of phase

- Jira Cloud REST API token + project + issue-type scheme access.
- A status/priority/type mapping table (project-configurable, like `.beans.yml`).
- A Markdown↔ADF conversion step (accept some fidelity loss, or restrict to a subset).
- An assignee identity map (bean assignee string → Jira accountId).

## Verdict

Yes — beans can be safely synced to Jira, **starting with a one-way push**. Full
two-way sync is viable but should be scoped as its own project because the risk is
concentrated entirely in identity mapping and conflict handling, not in the field
translation. Recommend creating follow-up beans for Phase 1 (implementation) if the
team wants to proceed.
