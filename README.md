---
title: Beanstalk
tags:
  - Beans
  - Gui
  - IssueTracker
---

A GUI for Beans issue tracking

## Keyboard Shortcuts

Shortcuts are disabled when the cursor is inside a text input, textarea, or select.

### Global

| Key      | Action                                |
| -------- | ------------------------------------- |
| `j`      | Select next bean                      |
| `k`      | Select previous bean                  |
| `l`      | Expand / collapse selected bean       |
| `Ctrl-h` | Move focus to left panel              |
| `Ctrl-l` | Move focus to right panel             |
| `g g`    | Jump to top of list                   |
| `G`      | Jump to bottom of list                |
| `/`      | Focus search input                    |
| `Escape` | Close modal / cancel edit / deselect  |
| `?`      | Toggle keyboard shortcut help overlay |

### Bean Actions

| Key       | Action                                |
| --------- | ------------------------------------- |
| `Enter`   | Open bean in detail panel             |
| `Space`   | Open the action menu for the bean     |
| `e`       | Open selected bean in external editor |
| `i`       | Enter inline edit mode                |
| `n` / `a` | Open new bean form                    |
| `s`       | Cycle status forward                  |
| `y`       | Copy bean ID to clipboard             |

### Detail Panel

| Key      | Action                       |
| -------- | ---------------------------- |
| `Ctrl-f` | Scroll body down half a page |
| `Ctrl-b` | Scroll body up half a page   |

### Action Menu

Press `Space` (or right-click a row) to open a contextual menu for the selected
bean. `j`/`k` and the arrow keys move, `Enter` runs, `Escape` closes.

| Key           | Action                          |
| ------------- | ------------------------------- |
| `Space`       | Open the menu                   |
| `Right-click` | Open the menu on a row          |
| `j` / `k`     | Move down / up                  |
| `Enter`       | Run the highlighted action      |
| `Escape`      | Close the menu                  |

"Edit (external)" is always the first entry; everything below it is a custom
script.

## Custom Scripts

The action menu lists any executable file found in either scripts directory:

| Scope   | Location                                                     |
| ------- | ------------------------------------------------------------ |
| Global  | `~/Library/Application Support/Beanstalk/scripts/`            |
| Project | `<project>/.beanstalk/scripts/`                              |

Override the global location with `"scripts_dir"` in
`~/Library/Application Support/Beanstalk/config.json`. A leading `~` is expanded.

When a project script and a global script share a **filename**, the project one
wins — the same way an earlier `PATH` entry shadows a later one.

### The contract

Any language will do; the shebang and the executable bit are the whole
interface. A script declares itself to the menu with comment headers in its
first 20 lines. Both `#` and `//` comment markers are accepted.

```bash
#!/usr/bin/env bash
# beanstalk-name: Open Jira issue
# beanstalk-description: Opens the linked Jira ticket in a browser
# beanstalk-key: J
# beanstalk-timeout: 30
```

| Header                   | Required | Meaning                                        |
| ------------------------ | -------- | ---------------------------------------------- |
| `beanstalk-name`         | yes      | Menu label. Without it the file is not listed.  |
| `beanstalk-description`  | no       | Menu subtitle.                                  |
| `beanstalk-key`          | no       | Single-character accelerator inside the menu.   |
| `beanstalk-timeout`      | no       | Seconds before the script is killed (default 30, max 600). |

A file with no `beanstalk-name` is ignored, so READMEs and helper scripts can
live in the same directory. Remember to `chmod +x` — the executable bit is the
opt-in.

### What a script receives

The bean arrives three ways, in increasing order of detail:

1. **`argv[1]`** — the bean's full file path.
2. **Environment variables** — every scalar field:

   `BEAN_ID`, `BEAN_TITLE`, `BEAN_STATUS`, `BEAN_TYPE`, `BEAN_PARENT`,
   `BEAN_PRIORITY`, `BEAN_ASSIGNEE`, `BEAN_CREATED_AT`, `BEAN_UPDATED_AT`,
   `BEAN_TAGS` (comma-separated), `BEAN_BLOCKING`, `BEAN_BLOCKED_BY`,
   `BEAN_FILE`, plus `BEANSTALK_PROJECT_PATH`, `BEANSTALK_BEANS_DIR` and
   `BEANSTALK_VERSION`.

   Absent optional fields are passed as empty strings.

3. **The full bean as JSON on stdin** — including `body` and `children`. This is
   the stable channel: new fields appear here without a contract change.

The working directory is the project root, and `PATH` is extended with
`/opt/homebrew/bin`, `/opt/homebrew/sbin` and `/usr/local/bin` so
Homebrew-installed tools resolve.

### What a script returns

The first line of output becomes a toast: stderr if the script wrote any,
otherwise stdout. A non-zero exit shows it as an error. If the script edits the
bean file, the file watcher refreshes the list on its own.
