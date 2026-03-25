---
# beanstalk-uk0l
title: Set up React project structure and install dependencies
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-zcyx
---

Initialize React with TypeScript, create directory structure (components/, hooks/, types/), and install required npm packages including react, react-dom, @tauri-apps/api, TailwindCSS, and react-markdown

## Details

Create src/ directory with subdirectories: components/, hooks/, types/. Initialize package.json and install dependencies: react, react-dom (for UI), @tauri-apps/api (for Tauri backend communication), TailwindCSS or plain CSS (for macOS native styling), react-markdown (for rendering bean body content). Configure TypeScript with tsconfig.json. Set up build tooling (Vite or similar) to work with Tauri. Create App.tsx as entry point.
