'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  addRecentActivity,
  clearRecentActivities,
  getRecentActivities,
  RecentActivity,
} from '@/lib/workspaceStore';

const typeIcon: Record<RecentActivity['type'], string> = {
  task: '✅',
  project: '📁',
  space: '🧭',
  plan: '🗓️',
  event: '🔔',
};

const actionColor: Record<RecentActivity['action'], string> = {
  visited: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  worked: 'bg-purple-900/50 text-purple-300 border border-purple-800',
  created: 'bg-emerald-900/50 text-emerald-300 border border-emerald-800',
  updated: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
  deleted: 'bg-red-900/50 text-red-300 border border-red-800',
};

export default function RecentPage() {
  const router = useRouter();
  const [recentItems, setRecentItems] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | RecentActivity['action']>('all');

  const refreshRecentItems = (): void => {
    setRecentItems(getRecentActivities());
  };

  useEffect(() => {
    refreshRecentItems();
    setLoading(false);

    const handleVisibility = (): void => {
      if (!document.hidden) {
        refreshRecentItems();
      }
    };

    const handleFocus = (): void => refreshRecentItems();
    const handleStorage = (): void => refreshRecentItems();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return recentItems.filter((item) => {
      const matchesSearch =
        normalizedTerm.length === 0 ||
        item.title.toLowerCase().includes(normalizedTerm) ||
        (item.context || '').toLowerCase().includes(normalizedTerm) ||
        item.type.toLowerCase().includes(normalizedTerm) ||
        item.action.toLowerCase().includes(normalizedTerm);

      const matchesAction = actionFilter === 'all' || item.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [actionFilter, recentItems, searchTerm]);

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const clearRecent = () => {
    clearRecentActivities();
    setRecentItems([]);
  };

  const openRecentItem = (item: RecentActivity): void => {
    addRecentActivity({
      title: item.title,
      type: item.type,
      action: 'visited',
      route: item.route,
      context: item.context || 'Opened from recent list',
    });

    router.push(item.route);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Recently Viewed</h1>
                <p className="text-gray-400 mt-2">Recent visited and worked activities</p>
              </div>
              {recentItems.length > 0 && (
                <button
                  onClick={clearRecent}
                  className="px-4 py-2 bg-red-900 text-red-200 rounded hover:bg-red-800 transition text-sm"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recent activities..."
                className="w-full md:w-2/3 px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />

              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(e.target.value as 'all' | RecentActivity['action'])
                }
                className="w-full md:w-1/3 px-4 py-2 bg-gray-900 border border-gray-800 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All actions</option>
                <option value="visited">Visited</option>
                <option value="worked">Worked</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading recent items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No recent activity found</p>
                <p className="text-gray-500 text-sm">
                  Work on plans, spaces, projects, or tasks to see activity here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openRecentItem(item)}
                    className="bg-gray-900 border border-gray-800 rounded p-4 hover:bg-gray-800 hover:border-gray-700 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-2xl">{typeIcon[item.type]}</span>
                      <div className="flex-1">
                        <p className="text-gray-200 font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.context || 'No context available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatTime(item.occurredAt)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded capitalize ${actionColor[item.action]}`}
                      >
                        {item.action}
                      </span>
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
