---
# beanstalk-8gcp
title: Add Tailwind Typography prose styles
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-64n0
---

Configure Tailwind CSS to include typography plugin for prose styling

## Details

The project uses Tailwind v4 which has built-in prose styles. Verify that:
1. The ReactMarkdown component uses `className="prose prose-sm dark:prose-invert max-w-none"`
2. Prose styles are automatically available (Tailwind v4 includes typography by default)
3. If prose classes don't work, check vite.config.ts for @tailwindcss/vite plugin configuration
4. Add custom prose overrides in index.css if needed for specific elements:
   ```css
   .prose code { /* inline code overrides */ }
   .prose pre { /* code block overrides */ }
   .prose a { /* link overrides - though we're using spans */ }
   ```

No additional packages needed - Tailwind v4 includes typography utilities out of the box.
