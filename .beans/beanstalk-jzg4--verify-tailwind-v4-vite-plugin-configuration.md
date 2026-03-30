---
# beanstalk-jzg4
title: Verify Tailwind v4 vite plugin configuration
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-8gcp
---

Confirm that vite.config.ts is properly configured with @tailwindcss/vite plugin to enable built-in typography utilities

## Details

Open vite.config.ts and verify that @tailwindcss/vite is imported and included in the plugins array. Tailwind v4 includes typography utilities out of the box when using the Vite plugin. Ensure the configuration matches: import tailwindcss from '@tailwindcss/vite'; and plugins: [tailwindcss(), ...]. If not configured, prose classes won't be available.
