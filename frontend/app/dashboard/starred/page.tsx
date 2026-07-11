'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface StarredItem {
  id: string;
  title: string;
  key: string;
  project: string;
  type: 'task' | 'project' | 'space';
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  icon: string;
  starredAt: Date;
}

export default function StarredPage() {
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | StarredItem['type']>('all');

  useEffect(() => {
    // Simulate fetching starred items from Firebase
    setLoading(true);
    const mockStarred: StarredItem[] = [
      {
        id: '1',
        title: 'Critical Bug - Login Authentication',
        key: 'KAN-5',
        project: 'Cross-Team Projects',
        type: 'task',
        priority: 'high',
        status: 'in-progress',
        icon: '📌',
        starredAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        id: '2',
        title: 'Cross-Team Projects',
        key: 'CTP',
        project: 'Space',
        type: 'space',
        icon: '⭐',
        starredAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        id: '3',
        title: 'Q2 Product Roadmap',
        key: 'ROAD-1',
        project: '[Example] Timeline Tracking',
        type: 'project',
        icon: '📊',
        starredAt: new Date(Date.now() - 10 * 86400000),
      },
    ];
    setStarredItems(mockStarred);
    setLoading(false);
  }, []);

  const filteredItems = starredItems.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const toggleStar = (id: string) => {
    setStarredItems(starredItems.filter((item) => item.id !== id));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-white">Starred</h1>
            <p className="text-gray-400 mt-2">Your bookmarked items and saved searches</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex space-x-4">
            {(['all', 'task', 'project', 'space'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm font-medium px-4 py-2 rounded transition ${
                  filter === f
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading starred items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No starred items</p>
                <p className="text-gray-500 text-sm">
                  Star items to save them for quick access
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-900 border border-gray-800 rounded p-4 hover:bg-gray-800 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-gray-200 font-medium">{item.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{item.key}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{item.project}</span>
                          {item.priority && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                                item.priority
                              )}`}
                            >
                              {item.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStar(item.id)}
                      className="text-yellow-400 hover:text-yellow-300 opacity-0 group-hover:opacity-100 transition"
                    >
                      ⭐
                    </button>
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
