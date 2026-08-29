import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { Bean, BeanScript } from './types/beans';
import { updateBean, updateBeanStatus, touchBean, openBeanInEditor, startWatching, stopWatching, listBeanScripts, runBeanScript, getScriptsDirs } from './lib/tauri';
import { CreateBeanForm } from './components/CreateBeanForm';
import { useConfig } from './hooks/useConfig';
import { useBeans } from './hooks/useBeans';
import { useToast } from './hooks/useToast';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { BeanList, collectTags } from './components/BeanList';
import { BeanDetail } from './components/BeanDetail';
import { Toast } from './components/Toast';
import { KeyboardHelp } from './components/KeyboardHelp';
import { BeanActionMenu, type MenuAnchor } from './components/BeanActionMenu';

/** Count beans that are stale: critical not updated in 12h, or high not updated in 48h. */
function countStaleBeans(beans: Bean[]): number {
  let count = 0;
  function visit(list: Bean[]) {
    for (const b of list) {
      const s = b.status?.toLowerCase();
      if (s === 'completed' || s === 'scrapped') { if (b.children?.length) visit(b.children); continue; }
      const p = b.priority?.toLowerCase();
      if (p === 'critical' || p === 'high') {
        const dateStr = b.updated_at ?? b.created_at;
        if (dateStr) {
          const ageMs = Date.now() - new Date(dateStr).getTime();
          const thresholdMs = p === 'critical' ? 12 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000;
          if (ageMs > thresholdMs) count++;
        }
      }
      if (b.children?.length) visit(b.children);
    }
  }
  visit(beans);
  return count;
}

/** Collect unique statuses from a bean tree. */
function collectStatuses(beans: Bean[], out = new Set<string>()): string[] {
  for (const b of beans) {
    out.add(b.status);
    if (b.children) collectStatuses(b.children, out);
  }
  return [...out].sort();
}

/** Recursively search a bean tree for a bean with the given id. */
function findBeanById(beans: Bean[], id: string): Bean | null {
  for (const bean of beans) {
    if (bean.id === id) return bean;
    if (bean.children && bean.children.length > 0) {
      const found = findBeanById(bean.children, id);
      if (found) return found;
    }
  }
  return null;
}

function App() {
  const { config, loading: configLoading, addProject, removeProject, setActiveProject } = useConfig();

  const activeProject = config?.last_active_project ?? null;

  const { beans, loading: beansLoading, refresh, lastRefreshed, applyBeanUpdate } = useBeans(activeProject);

  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(['todo', 'in-progress', 'draft']);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const availableTags = useMemo(() => collectTags(beans), [beans]);
  const staleCounts = useMemo<Record<string, number>>(() => {
    if (!activeProject) return {};
    const count = countStaleBeans(beans);
    return count > 0 ? { [activeProject]: count } : {};
  }, [activeProject, beans]);
  const { toasts, showToast, dismissToast } = useToast();

  // Flat visible bean id list, kept in sync by BeanList via onFlatListChange
  const flatBeanIdsRef = useRef<string[]>([]);

  // Ref to BeanList's toggleExpand function for keyboard-driven expand/collapse
  const beanListToggleExpandRef = useRef<((id: string) => void) | undefined>(undefined);

  // Tracks current keyboard selectedBeanIndex so handleKbToggleExpand is stale-free
  const selectedBeanIndexRef = useRef(-1);

  const handleFlatListChange = useCallback((ids: string[]) => {
    flatBeanIdsRef.current = ids;
  }, []);

  // Ref to expose BeanDetail's handleEditStart to the keyboard `e` handler
  const beanDetailEditStartRef = useRef<(() => void) | null>(null);

  // Refs so keyboard callbacks always see current values
  const selectedBeanIdRef = useRef(selectedBeanId);
  selectedBeanIdRef.current = selectedBeanId;
  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;
  const beansRef = useRef(beans);
  beansRef.current = beans;

  const handleKbOpenInEditor = useCallback(async () => {
    const beanId = selectedBeanIdRef.current;
    const project = activeProjectRef.current;
    if (!beanId || !project) return;
    try {
      await openBeanInEditor(project, beanId);
    } catch (e) {
      console.error('Failed to open bean in editor:', e);
      showToast(e instanceof Error ? e.message : 'Failed to open bean in editor', 'error');
    }
  }, [showToast]);

  // ── Bean action menu (Space / right-click) ────────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [menuBeanId, setMenuBeanId] = useState<string | null>(null);
  const [scripts, setScripts] = useState<BeanScript[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsDirs, setScriptsDirs] = useState<string[]>([]);

  /**
   * Open the menu for `beanId` at `at`, and (re)discover scripts.
   *
   * Discovery runs on every open rather than being cached, so a script the
   * user just dropped into the scripts directory shows up without a restart.
   */
  const openActionMenu = useCallback((beanId: string, at: MenuAnchor) => {
    const project = activeProjectRef.current;
    if (!project) return;
    setMenuBeanId(beanId);
    setMenuAnchor(at);
    setScriptsLoading(true);
    listBeanScripts(project)
      .then(setScripts)
      .catch((err) => {
        console.error('Failed to list bean scripts:', err);
        setScripts([]);
      })
      .finally(() => setScriptsLoading(false));
    getScriptsDirs(project).then(setScriptsDirs).catch(() => setScriptsDirs([]));
  }, []);

  const closeActionMenu = useCallback(() => {
    setMenuAnchor(null);
    setMenuBeanId(null);
  }, []);

  /**
   * `Space` opens the menu anchored to the selected row, so the keyboard path
   * lands in the same place the mouse path would.
   */
  const handleKbOpenActionMenu = useCallback(() => {
    const beanId = selectedBeanIdRef.current;
    if (!beanId) return;
    const row = document.querySelector<HTMLElement>(`[data-bean-row="${CSS.escape(beanId)}"]`);
    const rect = row?.getBoundingClientRect();
    openActionMenu(beanId, rect ? { x: rect.left + 24, y: rect.bottom } : { x: 120, y: 120 });
  }, [openActionMenu]);

  /**
   * Run a script and report the outcome.
   *
   * A script that edits the bean file needs no explicit refresh here — the
   * file watcher already picks that up — but refreshing anyway keeps the list
   * correct for scripts that write via another path.
   */
  const handleRunScript = useCallback(
    async (scriptId: string) => {
      const project = activeProjectRef.current;
      const beanId = menuBeanId;
      if (!project || !beanId) return;
      try {
        const result = await runBeanScript(project, beanId, scriptId);
        // Prefer the script's own words; fall back to a generic outcome.
        const detail = (result.stderr.trim() || result.stdout.trim()).split('\n')[0];
        if (result.timed_out) {
          showToast(`${result.name} timed out`, 'error');
        } else if (!result.success) {
          showToast(detail || `${result.name} failed (exit ${result.exit_code ?? '?'})`, 'error');
        } else {
          showToast(detail || `${result.name} finished`, 'success');
        }
      } catch (e) {
        console.error('Failed to run bean script:', e);
        showToast(e instanceof Error ? e.message : 'Failed to run script', 'error');
      } finally {
        refresh();
      }
    },
    [menuBeanId, showToast, refresh]
  );

  /**
   * Open the editor for the bean the menu was opened on, rather than for the
   * current selection. Right-click selects the row first so the two normally
   * agree, but the menu must act on what it is labelled with.
   */
  const handleMenuEditExternal = useCallback(async () => {
    const project = activeProjectRef.current;
    if (!menuBeanId || !project) return;
    try {
      await openBeanInEditor(project, menuBeanId);
    } catch (e) {
      console.error('Failed to open bean in editor:', e);
      showToast(e instanceof Error ? e.message : 'Failed to open bean in editor', 'error');
    }
  }, [menuBeanId, showToast]);

  const handleKbEnterEditMode = useCallback(() => {
    beanDetailEditStartRef.current?.();
  }, []);

  const handleKbNewBean = useCallback(() => {
    setIsCreating(true);
    setSelectedBeanId(null);
  }, []);

  const handleKbCycleStatus = useCallback(() => {
    const beanId = selectedBeanIdRef.current;
    const project = activeProjectRef.current;
    if (!beanId || !project) return;
    const currentBeans = beansRef.current;
    const bean = findBeanById(currentBeans, beanId);
    if (!bean) return;
    const statuses = collectStatuses(currentBeans);
    if (statuses.length === 0) return;
    const currentIdx = statuses.indexOf(bean.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    updateBeanStatus(project, beanId, nextStatus)
      .then(() => refresh())
      .catch((err) => {
        console.error('Failed to cycle status:', err);
        showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, showToast]);

  const handleKbToggleExpand = useCallback(() => {
    const id = selectedBeanIdRef.current;
    if (id) beanListToggleExpandRef.current?.(id);
  }, []);

  const handleKbCopyId = useCallback(() => {
    const beanId = selectedBeanIdRef.current;
    if (!beanId) return;
    navigator.clipboard.writeText(beanId).catch((err) => {
      console.error('Failed to copy bean ID:', err);
    });
    showToast('Copied bean ID', 'success');
  }, [showToast]);

  // Keyboard navigation
  const {
    focusedPanel,
    selectedBeanIndex,
    setSelectedBeanIndex,
    isModalOpen,
    setIsModalOpen,
    registerEscapeHandler,
  } = useKeyboardNav({
    beanCount: flatBeanIdsRef.current.length,
    onSelectIndex: (index) => {
      if (index < 0) {
        setSelectedBeanId(null);
        return;
      }
      const id = flatBeanIdsRef.current[index];
      if (id) {
        setSelectedBeanId(id);
        setIsCreating(false);
      }
    },
    onOpenInEditor: handleKbOpenInEditor,
    onEnterEditMode: handleKbEnterEditMode,
    onNewBean: handleKbNewBean,
    onCycleStatus: handleKbCycleStatus,
    onCopyId: handleKbCopyId,
    onToggleExpand: handleKbToggleExpand,
    onOpenActionMenu: handleKbOpenActionMenu,
  });

  // Keep selectedBeanIndexRef current so handleKbToggleExpand is never stale
  selectedBeanIndexRef.current = selectedBeanIndex;


  // Start/stop watching when activeProject changes
  useEffect(() => {
    if (!activeProject) return;

    startWatching(activeProject).catch((err) => {
      console.warn('Failed to start watching:', err);
    });

    return () => {
      stopWatching(activeProject).catch((err) => {
        console.warn('Failed to stop watching:', err);
      });
    };
  }, [activeProject]);

  // Derived state
  const selectedBean = selectedBeanId ? findBeanById(beans, selectedBeanId) ?? null : null;

  const availableStatuses = collectStatuses(beans);

  // Callbacks
  const handleSelectProject = useCallback(
    async (path: string) => {
      setSelectedBeanId(null);
      setStatusFilter(['todo', 'in-progress', 'draft']);
      setPriorityFilter([]);
      setTagFilter([]);
      try {
        await setActiveProject(path);
      } catch (err) {
        console.warn('Failed to set active project:', err);
        showToast(err instanceof Error ? err.message : 'Failed to set active project', 'error');
      }
    },
    [setActiveProject, showToast]
  );

  const handleAddProject = useCallback(
    async (path: string) => {
      try {
        await addProject(path);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add project', 'error');
      }
    },
    [addProject, showToast]
  );

  const handleRemoveProject = useCallback(
    async (path: string) => {
      try {
        await removeProject(path);
        // If the removed project was the active one, clear selection
        if (path === activeProject) {
          setSelectedBeanId(null);
        }
      } catch (err) {
        console.error('Failed to remove project:', err);
        showToast(err instanceof Error ? err.message : 'Failed to remove project', 'error');
      }
    },
    [removeProject, activeProject, showToast]
  );

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!activeProject || !selectedBeanId) return;
      try {
        const updated = await updateBeanStatus(activeProject, selectedBeanId, status);
        applyBeanUpdate(updated);
        refresh();
      } catch (err) {
        console.error('Failed to update status:', err);
        showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      }
    },
    [activeProject, selectedBeanId, refresh, showToast]
  );

  const handlePriorityChange = useCallback(
    async (priority: string | null) => {
      if (!activeProject || !selectedBeanId) return;
      try {
        const updated = await updateBean({ projectPath: activeProject, beanId: selectedBeanId, priority });
        applyBeanUpdate(updated);
        refresh();
      } catch (err) {
        console.error('Failed to update priority:', err);
        showToast(err instanceof Error ? err.message : 'Failed to update priority', 'error');
      }
    },
    [activeProject, selectedBeanId, refresh, showToast]
  );

  const handleSave = useCallback(
    async (fields: Partial<Bean>) => {
      if (!activeProject || !selectedBeanId) return;
      try {
        const updated = await updateBean({
          projectPath: activeProject,
          beanId: selectedBeanId,
          title: fields.title,
          status: fields.status,
          tags: fields.tags,
          assignee: fields.assignee,
          body: fields.body,
          parent: fields.parent,
          priority: fields.priority,
          blocking: fields.blocking,
          blockedBy: fields.blocked_by,
        });
        applyBeanUpdate(updated);
        refresh();
        showToast('Bean saved', 'success');
      } catch (err) {
        console.error('Failed to save bean:', err);
        showToast(err instanceof Error ? err.message : 'Failed to save bean', 'error');
      }
    },
    [activeProject, selectedBeanId, refresh, showToast]
  );

  const handleOpenInEditor = useCallback(() => {
    // BeanDetail handles opening in editor internally
  }, []);

  const handleTouch = useCallback(async () => {
    if (!activeProject || !selectedBeanId) return;
    try {
      const updated = await touchBean(activeProject, selectedBeanId);
      applyBeanUpdate(updated);
      refresh();
      showToast('updated_at refreshed', 'success');
    } catch (err) {
      console.error('Failed to touch bean:', err);
      showToast(err instanceof Error ? err.message : 'Failed to touch bean', 'error');
    }
  }, [activeProject, selectedBeanId, applyBeanUpdate, refresh, showToast]);

  // Sync selectedBeanIndex when selectedBeanId changes due to clicks
  useEffect(() => {
    if (selectedBeanId === null) {
      // Only reset index if it isn't already -1 (avoid infinite loop)
      setSelectedBeanIndex(-1);
      return;
    }
    const idx = flatBeanIdsRef.current.indexOf(selectedBeanId);
    if (idx >= 0) {
      setSelectedBeanIndex(idx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBeanId]);

  // Global keyboard shortcuts (meta keys only; vim navigation handled by useKeyboardNav)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'n') {
        e.preventDefault();
        setIsCreating(true);
        setSelectedBeanId(null);
      } else if (isMeta && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }
      // Note: Escape is handled entirely by useKeyboardNav's escape chain
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading spinner while config is not yet loaded
  if (config === null && configLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen text-gray-400 dark:text-gray-500">
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <Layout
        focusedPanel={focusedPanel}
        sidebar={
          <Sidebar
            projects={config?.projects ?? []}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onAddProject={handleAddProject}
            onRemoveProject={handleRemoveProject}
            recentProjects={config?.recent_projects ?? []}
            priorityFilter={priorityFilter}
            onPriorityFilter={setPriorityFilter}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            onTagFilter={setTagFilter}
            tags={availableTags}
            staleCounts={staleCounts}
          />
        }
        list={
          <BeanList
            beans={beans}
            selectedId={selectedBeanId}
            onSelect={(id) => {
              setSelectedBeanId(id);
              setIsCreating(false);
            }}
            loading={beansLoading}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            tagFilter={tagFilter}
            lastRefreshed={lastRefreshed}
            onNewBean={() => {
              setIsCreating(true);
              setSelectedBeanId(null);
            }}
            keyboardSelectedIndex={selectedBeanIndex >= 0 ? selectedBeanIndex : undefined}
            onFlatListChange={handleFlatListChange}
            registerEscapeHandler={registerEscapeHandler}
            toggleExpandRef={beanListToggleExpandRef}
            onContextMenu={openActionMenu}
          />
        }
        detail={
          isCreating ? (
            <CreateBeanForm
              projectPath={activeProject ?? ''}
              allBeans={beans}
              onCreated={(bean) => {
                refresh();
                setSelectedBeanId(bean.id);
                setIsCreating(false);
              }}
              onCancel={() => setIsCreating(false)}
              registerEscapeHandler={registerEscapeHandler}
            />
          ) : (
            <BeanDetail
              bean={selectedBean}
              onOpenInEditor={handleOpenInEditor}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onSave={handleSave}
              onTouch={handleTouch}
              onError={(msg) => showToast(msg, 'error')}
              availableStatuses={availableStatuses}
              allBeans={beans}
              projectPath={activeProject ?? undefined}
              registerEscapeHandler={registerEscapeHandler}
              onEditStartRef={beanDetailEditStartRef}
            />
          )
        }
      />
      {/* Bean action menu (Space / right-click) */}
      <BeanActionMenu
        open={menuAnchor !== null}
        anchor={menuAnchor}
        beanTitle={(menuBeanId ? findBeanById(beans, menuBeanId)?.title : null) ?? ''}
        scripts={scripts}
        loading={scriptsLoading}
        scriptsDirs={scriptsDirs}
        onEditExternal={handleMenuEditExternal}
        onRun={handleRunScript}
        onClose={closeActionMenu}
      />
      {/* Keyboard help overlay */}
      <KeyboardHelp
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}

export default App;
