---
title: Beanstalk
tags:
  - Beans
  - Gui
  - IssueTracker
---

A GUI for Beans issue tracking

## Install

Download the file for your platform from the
[latest release](https://github.com/robertarles/beanstalk/releases/latest).

| Platform                      | File                                  |
| ----------------------------- | ------------------------------------- |
| macOS (Apple Silicon + Intel) | `Beanstalk_<version>_universal.dmg`   |
| Linux, any distro             | `*.AppImage`                          |
| Debian / Ubuntu               | `*.deb`                               |
| Fedora / RHEL / openSUSE      | `*.rpm`                               |

Linux files come in `amd64`/`x86_64` (most PCs) and `arm64`/`aarch64` (ARM
machines) variants. `uname -m` tells you which you have.

### Prerequisite: the `beans` CLI

Beanstalk reads and writes beans **through the
[`beans`](https://github.com/hmans/beans) CLI**, so install `beans` first. Without
it, no beans are shown; only the external editor still works. Beanstalk finds it on `PATH`, or in `~/.local/bin`,
`/usr/local/bin`, `/usr/bin` or `/opt/homebrew/bin`. If yours is elsewhere (for
example `~/go/bin` after `go install`), set `"beans_bin"` in the Beanstalk config
file:

- macOS: `~/Library/Application Support/Beanstalk/config.json`
- Linux: `~/.config/Beanstalk/config.json`

```json
{ "beans_bin": "~/go/bin/beans" }
```

### Installing on macOS

Beanstalk is **not yet signed by Apple**, so macOS blocks it the first time you
open it. This is a one-time step; after it, Beanstalk opens normally.

1. Open the `.dmg` and drag **Beanstalk** into **Applications**.
2. Open Beanstalk from Applications. macOS says it *"cannot verify that Beanstalk
   is free of malware"* (or *"Apple could not verify…"*). Click **Done** (or
   **OK**). Don't click **Move to Trash**.
3. Open **System Settings → Privacy & Security** and scroll down to the
   **Security** section. You'll see *"Beanstalk was blocked to protect your Mac."*
   Click **Open Anyway** and confirm with your password or Touch ID.
4. Open Beanstalk again and click **Open** in the final prompt.

On macOS 14 (Sonoma) and earlier, you can instead **right-click** (or
Control-click) Beanstalk in Applications, choose **Open**, then click **Open**
in the dialog.

**Terminal alternative.** If you prefer, or if macOS says the app *"is damaged
and can't be opened"*, remove the download quarantine flag instead:

```sh
xattr -dr com.apple.quarantine /Applications/Beanstalk.app
```

Both methods only tell macOS to trust this one app. They don't change any
system-wide security setting.

### Installing on Linux

**AppImage** (any distro, no install):

```sh
chmod +x Beanstalk_*.AppImage
./Beanstalk_*.AppImage
```

**Debian / Ubuntu:**

```sh
sudo apt install ./beanstalk_*.deb
```

**Fedora / RHEL:**

```sh
sudo dnf install ./beanstalk-*.rpm
```

### Building from source / cutting a release

`make help` lists the targets. To publish a release, bump `version` in both
`src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, commit and push to `main`,
then run `make release`. That pushes a `v<version>` tag, and GitHub Actions
builds every installer into a **draft** release. Review it and publish it on
GitHub.

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

## Editing Beans

Beanstalk reads bean files with its own parser but **writes them only through the
`beans` CLI**. The file format belongs to beans, and every reimplementation drifts
from it, so there is exactly one writer.

Two consequences worth knowing:

- **Editing needs `beans` on your `PATH`** (or a `beans_bin` path in the Beanstalk
  config). Without it, Edit, Touch, the status dropdown and new-bean creation are
  disabled, and the reason is shown on the disabled control. Reading is unaffected.
- **The external editor is never gated.** `e`, and the `Editor ↗` button, launch
  your editor and write nothing through Beanstalk, so they keep working when the
  CLI is missing — and they can write frontmatter that beans does not model.

There are two ways to edit a body:

| | Inline (`i`) | External (`e`) |
| --- | --- | --- |
| Needs the `beans` CLI | yes | no |
| `[[` bean picker | yes | no |
| Suits long-form work | adequate | better |
| Can write unmodelled frontmatter | no | yes |

A save writes **only the fields you changed**; anything untouched is left exactly
as it is on disk. Saving with nothing changed writes nothing — use `Touch` to bump
`updated_at` deliberately.

If a bean changes on disk while you have it open for editing, Beanstalk says so,
and a body save is **refused** rather than overwriting the other change. Your text
stays in the form; reload or reconcile in the external editor.

> **No assignee field.** beans has no assignee, so Beanstalk cannot persist one.
> An `assignee:` key already in a file is still read and displayed, and the
> external editor can still set one — but any save through Beanstalk drops it,
> because beans rewrites frontmatter it does not model. Custom data belongs in the
> **body**, which beans preserves verbatim.

## Linking Beans with `[[...]]`

A bean body can reference another bean in prose, and the reference becomes a
clickable link in the detail pane:

```markdown
Same root cause as [[beanstalk-4ad6]].
Superseded by [[hivelens-7k2p|the UTM provider fix]].
```

This is for *mentions* — "same cause as X", "superseded by Y". Structural
relationships stay in `parent`, `blocking` and `blocked_by`, which are dependency
edges rather than prose.

### What goes inside the brackets

A **bean id**, and only a bean id. Titles are not accepted: they change, and two
beans can share one. Ids survive a retitle.

| Form                        | Renders as                                   |
| --------------------------- | -------------------------------------------- |
| `[[beanstalk-4ad6]]`        | the id, linked                                |
| `[[beanstalk-4ad6\|label]]` | `label`, linked                               |
| `[[BEANSTALK-4AD6]]`        | the same link — matching is case-insensitive  |
| `[[ beanstalk-4ad6 ]]`      | the same link — whitespace is trimmed         |

Only the first `|` splits the target from the label, so a label may contain
further pipes. An empty label (`[[beanstalk-4ad6|]]`) falls back to the id.

Type `[[` in a bean's description field to get a bean picker: arrow keys move,
`Enter` or `Tab` inserts, `Escape` closes and leaves what you typed alone.

### Links across projects

A bare id works across projects. Nothing extra is needed — no `[[project:id]]`
form exists, and none is required:

```markdown
Same root cause as [[hivelens-7k2p]].
```

Bean ids already carry their project's prefix (the `prefix` key in `.beans.yml`),
so an id says which project owns it. A link to another project you have added to
Beanstalk is shown in violet with an `↗` marker; hovering it reveals that bean's
title, and clicking it switches to that project and selects the bean.

A link to a project you have **not** added to Beanstalk cannot be resolved, and
reads as missing.

### Missing links

An id that resolves nowhere renders as dimmed, non-clickable text reading
**missing or archived** on hover. There are two ordinary reasons for it:

- the bean was deleted, or
- the bean was **archived**. `beans archive` moves a bean into `.beans/archive`,
  which Beanstalk does not scan, so an archived bean cannot be resolved even
  though its file still exists.

The wording says "missing or archived" rather than "unknown" precisely because
archiving is the common case and is nobody's mistake.

> **Known issue — colliding project prefixes.** Nothing currently stops two
> projects declaring the same `prefix` in `.beans.yml`, or both defaulting to
> `bean-` by declaring none. Ids would then collide, so Beanstalk refuses to
> resolve links with an ambiguous prefix rather than guessing a project: they read
> as missing. Give each project a distinct prefix.

### Writing a literal `[[`

Use inline code:

```markdown
Write `[[like this]]` to show the brackets literally.
```

Backslashes do **not** work here. Markdown consumes `\[\[` before Beanstalk sees
the text, leaving it identical to an unescaped `[[`, so `\[\[x\]\]` still becomes
a link. Fenced code blocks are left alone too.

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
