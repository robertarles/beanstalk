---
# beanstalk-fnbr
title: Implement project management features in frontend
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:7
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:31Z
parent: beanstalk-ut4w
---

Build UI and state management for adding, removing, and switching between bean projects

## Details

1. Create useConfig custom hook:
```typescript
const useConfig = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const loadConfig = async () => {
    const cfg = await invoke('get_config');
    setConfig(cfg);
  };
  const addProject = async (path: string) => {
    const project = await invoke('add_project', { path });
    await loadConfig(); // Refresh
  };
  // ... similar for removeProject, setActiveProject
  return { config, loadConfig, addProject, removeProject, setActiveProject };
};
```
2. Implement "Add Project" UI:
   - Button in sidebar triggers file dialog
   - Use Tauri dialog API: `dialog.open({ directory: true })`
   - Validate selected directory contains .beans/
   - Show error message if invalid
   - Update config and sidebar list
3. Implement "Remove Project" UI:
   - Delete/remove icon next to each project
   - Confirmation dialog before removal
   - Update config, switch to another project if active project removed
4. Implement project switching:
   - Click on project name in sidebar to switch
   - Save last_active_project to config
   - Load beans for new project
   - Stop old file watcher, start new one
5. Display project name from .beans.yml in sidebar
6. Persist active project selection across app restarts
7. Handle edge cases: no projects, all projects removed, invalid project paths
