---
# beanstalk-1i74
title: Verify package.json contains both dependencies
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:13Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-0dip
---

Confirm react-markdown and remark-gfm are listed in the dependencies section of package.json

## Details

Open package.json and verify that both "react-markdown" and "remark-gfm" appear in the "dependencies" object (NOT in "devDependencies"). Check that react-markdown version is 9.x or higher. The entries should look like: `"react-markdown": "^9.x.x"` and `"remark-gfm": "^x.x.x"`. This confirms npm correctly added them as runtime dependencies rather than dev dependencies, which is important because these packages are needed for the application to render markdown in production.
