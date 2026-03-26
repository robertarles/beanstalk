import { useEffect, useState, useCallback } from 'react';
import type { Bean } from './types/beans';
import { updateBean, updateBeanStatus, startWatching, stopWatching } from './lib/tauri';
import { CreateBeanForm } from './components/CreateBeanForm';
import { useConfig } from './hooks/useConfig';
import { useBeans } from './hooks/useBeans';
import { useToast } from './hooks/useToast';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { BeanList } from './components/BeanList';
import { BeanDetail } from './components/BeanDetail';
import { Toast } from './components/Toast';

const AVAILABLE_STATUSES = ['open', 'in-progress', 'done', 'archived'];

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

  const { beans, loading: beansLoading, refresh, lastRefreshed } = useBeans(activeProject);

  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

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

  const availableStatuses = AVAILABLE_STATUSES;

  // Callbacks
  const handleSelectProject = useCallback(
    async (path: string) => {
      setSelectedBeanId(null);
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
        await updateBeanStatus(activeProject, selectedBeanId, status);
        refresh();
      } catch (err) {
        console.error('Failed to update status:', err);
        showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      }
    },
    [activeProject, selectedBeanId, refresh, showToast]
  );

  const handleSave = useCallback(
    async (fields: Partial<Bean>) => {
      if (!activeProject || !selectedBeanId) return;
      try {
        await updateBean({
          projectPath: activeProject,
          beanId: selectedBeanId,
          title: fields.title,
          status: fields.status,
          tags: fields.tags,
          assignee: fields.assignee,
          body: fields.body,
          parent: fields.parent,
        });
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

  // Global keyboard shortcuts
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
      } else if (e.key === 'Escape') {
        if (isCreating) {
          setIsCreating(false);
        } else {
          setSelectedBeanId(null);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating]);

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
        sidebar={
          <Sidebar
            projects={config?.projects ?? []}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onAddProject={handleAddProject}
            onRemoveProject={handleRemoveProject}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            statuses={AVAILABLE_STATUSES}
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
            lastRefreshed={lastRefreshed}
            onNewBean={() => {
              setIsCreating(true);
              setSelectedBeanId(null);
            }}
          />
        }
        detail={
          isCreating ? (
            <CreateBeanForm
              projectPath={activeProject ?? ''}
              availableStatuses={AVAILABLE_STATUSES}
              allBeans={beans}
              onCreated={(bean) => {
                refresh();
                setSelectedBeanId(bean.id);
                setIsCreating(false);
              }}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <BeanDetail
              bean={selectedBean}
              onOpenInEditor={handleOpenInEditor}
              onStatusChange={handleStatusChange}
              onSave={handleSave}
              availableStatuses={availableStatuses}
              allBeans={beans}
              projectPath={activeProject ?? undefined}
            />
          )
        }
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
