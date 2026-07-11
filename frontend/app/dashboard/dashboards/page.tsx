'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  owner: string;
  widgets: number;
  shared: boolean;
  lastModified: Date;
}

export default function DashboardsPage() {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Simulate fetching dashboards from Firebase
    setLoading(true);
    const mockDashboards: Dashboard[] = [
      {
        id: '1',
        name: 'Team Overview',
        description: 'High-level view of team productivity and project status',
        owner: user?.displayName || 'You',
        widgets: 6,
        shared: true,
        lastModified: new Date(Date.now() - 2 * 86400000),
      },
      {
        id: '2',
        name: 'Sprint Dashboard',
        description: 'Current sprint metrics and burndown chart',
        owner: 'Scrum Master',
        widgets: 8,
        shared: true,
        lastModified: new Date(Date.now() - 1 * 86400000),
      },
      {
        id: '3',
        name: 'Personal Metrics',
        description: 'My tasks, time tracking, and performance metrics',
        owner: user?.displayName || 'You',
        widgets: 4,
        shared: false,
        lastModified: new Date(Date.now() - 5 * 86400000),
      },
    ];
    setDashboards(mockDashboards);
    setLoading(false);
  }, [user?.displayName]);

  const deleteDashboard = (id: string) => {
    setDashboards(dashboards.filter((d) => d.id !== id));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboards</h1>
                <p className="text-gray-400 mt-2">
                  Create customizable dashboards for metrics and insights
                </p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                + Create Dashboard
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="bg-gray-900 border-b border-gray-800 p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowCreate(false);
                }}
                className="max-w-2xl space-y-4"
              >
                <input
                  type="text"
                  placeholder="Dashboard name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <label className="flex items-center space-x-2 text-gray-300">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Share with team</span>
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading dashboards...</p>
              </div>
            ) : dashboards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No dashboards yet</p>
                <p className="text-gray-500 text-sm mb-4">
                  Create a dashboard to visualize your metrics
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  Create First Dashboard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition cursor-pointer group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {dashboard.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2">
                          {dashboard.description}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDashboard(dashboard.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Widgets Count */}
                    <div className="bg-gray-950 rounded p-3 mb-4">
                      <p className="text-sm text-gray-400">
                        {dashboard.widgets} widgets configured
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-gray-500 border-t border-gray-800 pt-4">
                      <p>Owner: {dashboard.owner}</p>
                      <p>Modified: {formatDate(dashboard.lastModified)}</p>
                      <p>
                        {dashboard.shared ? (
                          <span className="text-blue-400">🔗 Shared with team</span>
                        ) : (
                          <span className="text-gray-600">🔒 Private</span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium">
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition text-sm font-medium">
                        View
                      </button>
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
