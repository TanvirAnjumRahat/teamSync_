'use client';

export type ActivityType = 'task' | 'project' | 'space' | 'plan' | 'event';
export type ActivityAction = 'visited' | 'worked' | 'created' | 'updated' | 'deleted';

export interface RecentActivity {
  id: string;
  title: string;
  type: ActivityType;
  action: ActivityAction;
  route: string;
  context?: string;
  occurredAt: string;
}

export interface ProjectRegistryItem {
  id: string;
  name: string;
  key: string;
  spaceId: string;
}

const RECENT_ACTIVITIES_KEY = 'teamsync:recent-activities:v1';
const PROJECT_REGISTRY_KEY = 'teamsync:project-registry:v1';
const MAX_RECENT_ITEMS = 50;

export const DEFAULT_PROJECT_REGISTRY: ProjectRegistryItem[] = [
  { id: 's1-p1', name: 'Website Redesign', key: 'WR', spaceId: '1' },
  { id: 's1-p2', name: 'Mobile App', key: 'MA', spaceId: '1' },
  { id: 's2-p1', name: 'Release Roadmap', key: 'RR', spaceId: '2' },
  { id: 's2-p2', name: 'Customer Portal', key: 'CP', spaceId: '2' },
];

const isBrowser = (): boolean => typeof window !== 'undefined';

const parseStorage = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getRecentActivities = (): RecentActivity[] => {
  if (!isBrowser()) return [];

  const stored = parseStorage<RecentActivity[]>(
    window.localStorage.getItem(RECENT_ACTIVITIES_KEY),
    []
  );

  return stored
    .filter((item) => item?.id && item?.title && item?.route && item?.occurredAt)
    .sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
};

export const addRecentActivity = (
  activity: Omit<RecentActivity, 'id' | 'occurredAt'>
): void => {
  if (!isBrowser()) return;

  const existing = getRecentActivities();

  const nextItem: RecentActivity = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
    ...activity,
  };

  const deduped = existing.filter(
    (item) =>
      !(
        item.title === nextItem.title &&
        item.action === nextItem.action &&
        item.type === nextItem.type &&
        item.route === nextItem.route
      )
  );

  const next = [nextItem, ...deduped].slice(0, MAX_RECENT_ITEMS);
  window.localStorage.setItem(RECENT_ACTIVITIES_KEY, JSON.stringify(next));
};

export const clearRecentActivities = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(RECENT_ACTIVITIES_KEY);
};

export const getProjectRegistry = (): ProjectRegistryItem[] => {
  if (!isBrowser()) return DEFAULT_PROJECT_REGISTRY;

  const stored = parseStorage<ProjectRegistryItem[]>(
    window.localStorage.getItem(PROJECT_REGISTRY_KEY),
    []
  );

  if (stored.length === 0) {
    window.localStorage.setItem(
      PROJECT_REGISTRY_KEY,
      JSON.stringify(DEFAULT_PROJECT_REGISTRY)
    );
    return DEFAULT_PROJECT_REGISTRY;
  }

  return stored.filter((project) => project?.id && project?.name && project?.key);
};

const saveProjectRegistry = (projects: ProjectRegistryItem[]): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROJECT_REGISTRY_KEY, JSON.stringify(projects));
};

export const upsertProjectRegistry = (project: ProjectRegistryItem): void => {
  const existing = getProjectRegistry();
  const hasProject = existing.some((item) => item.id === project.id);

  const next = hasProject
    ? existing.map((item) => (item.id === project.id ? project : item))
    : [project, ...existing];

  saveProjectRegistry(next);
};

export const removeProjectFromRegistry = (projectId: string): void => {
  const existing = getProjectRegistry();
  const next = existing.filter((item) => item.id !== projectId);
  saveProjectRegistry(next);
};
