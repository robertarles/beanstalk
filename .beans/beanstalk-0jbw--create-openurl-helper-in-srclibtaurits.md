---
# beanstalk-0jbw
title: Create openUrl helper in src/lib/tauri.ts
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:14Z
parent: beanstalk-rcdr
---

Add a TypeScript helper function that wraps the opener plugin's openUrl function

## Details

In src/lib/tauri.ts, import `openUrl` from '@tauri-apps/plugin-opener' and export a wrapper function:
```typescript
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';

export const openUrl = (url: string): Promise<void> => {
  return tauriOpenUrl(url);
};
```
This provides a consistent API surface alongside other Tauri helpers in the project. The wrapper returns a Promise that resolves when the URL is opened or rejects on error.
