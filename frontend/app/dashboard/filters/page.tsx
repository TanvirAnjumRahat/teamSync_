'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Filter {
  id: string;
  name: string;
  description: string;
  criteria: string;
  results: number;
  owner: string;
  shared: boolean;
}

export default function FiltersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Simulate fetching filters from Firebase
    setLoading(true);
    const mockFilters: Filter[] = [
      {
        id: '1',
        name: 'My Open Issues',
        description: 'All issues assigned to me that are not done',
        criteria: 'assignee = currentUser() AND status != Done',
        results: 8,
        owner: user?.displayName || 'You',
        shared: false,
      },
      {
        id: '2',
        name: 'High Priority Bugs',
        description: 'All high priority bugs across all projects',
        criteria: 'type = Bug AND priority = High',
        results: 12,
        owner: 'Team Lead',
        shared: true,
      },
      {
        id: '3',
        name: 'Due This Week',
        description: 'Tasks due in the next 7 days',
        criteria: 'dueDate <= now() + 7d AND status != Done',
        results: 24,
        owner: user?.displayName || 'You',
        shared: true,
      },
      {
        id: '4',
        name: 'Ready for Progress',
        description: 'Unstarted tasks with all dependencies resolved',
        criteria: 'status = Ready AND dependencies = resolved',
        results: 5,
        owner: 'DevOps',
        shared: true,
      },
    ];
    setFilters(mockFilters);
    setLoading(false);
  }, [user?.displayName]);

  const deleteFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Filters</h1>
                <p className="text-gray-400 mt-2">Saved searches and custom filters</p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                + New Filter
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
                  placeholder="Filter name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Description"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="JQL (e.g., assignee = currentUser() AND status != Done)"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                  >
                    Create Filter
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
                <p className="text-gray-400">Loading filters...</p>
              </div>
            ) : filters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No filters yet</p>
                <p className="text-gray-500 text-sm">
                  Create a filter to save your searches
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="bg-gray-900 border border-gray-800 rounded p-6 hover:border-gray-700 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {filter.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {filter.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-blue-400">
                          {filter.results}
                        </span>
                        <button
                          onClick={() => deleteFilter(filter.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Filter Details */}
                    <div className="bg-gray-950 rounded p-3 mb-4">
                      <p className="text-xs text-gray-500 font-mono">
                        {filter.criteria}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 border-t border-gray-800 pt-4">
                      <span>Owner: {filter.owner}</span>
                      <span>
                        {filter.shared ? (
                          <span className="text-blue-400">🔗 Shared</span>
                        ) : (
                          <span className="text-gray-600">🔒 Private</span>
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium">
                        Use Filter
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition text-sm font-medium">
                        Edit
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
