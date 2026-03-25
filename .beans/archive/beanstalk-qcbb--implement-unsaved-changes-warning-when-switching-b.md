---
# beanstalk-qcbb
title: Implement unsaved changes warning when switching beans
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:07Z
parent: beanstalk-64k3
---

Add confirmation dialog that warns users about unsaved changes when trying to switch to a different bean while in edit mode

## Details

Detect when user attempts to switch selected bean (from BeanList or other navigation) while in edit mode with unsaved changes. Show confirmation dialog with message You have unsaved changes and three options: Save (save changes and switch), Discard (discard changes and switch), Cancel (stay on current bean). Implement save option to call update_bean and switch on success. Implement discard to reset form and switch immediately. Implement cancel to close dialog and remain in edit mode. Track dirty state by comparing form values to original bean data.
