---
# beanstalk-6046
title: Verify package-lock.json is updated with new packages
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:13Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-0dip
---

Confirm package-lock.json contains entries for react-markdown and remark-gfm with resolved versions and integrity hashes

## Details

Check that package-lock.json has been updated with detailed entries for both react-markdown and remark-gfm, including their full dependency trees. The lockfile should contain resolved version numbers, integrity hashes (SHA-512), and resolved tarball URLs for both packages and all their transitive dependencies. This ensures reproducible builds across different environments and prevents version drift. The lockfile is critical for maintaining consistent dependency versions in CI/CD and production deployments.
