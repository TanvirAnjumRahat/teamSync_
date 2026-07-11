'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';

export default function MyWorkspacesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentWorkspace, switchWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadMyWorkspaces() {
      try {
        setLoading(true);
        const res = await ApiClient.getMyWorkspaces();
        if (res.success && res.data) {
          setWorkspaces(res.data as any[]);
        }
      } catch (err) {
        console.error('Failed to load my workspaces', err);
      } finally {
        setLoading(false);
      }
    }

    loadMyWorkspaces();
  }, [user, router]);

  const handleWorkspaceClick = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-lg">TeamSync AI</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Workspaces</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">View your workspaces and recent activity.</p>

        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="flex flex-col gap-4">
                <div
                  onClick={() => handleWorkspaceClick(workspace.id)}
                  className={`bg-white dark:bg-gray-900 rounded-xl p-6 border-2 cursor-pointer transition hover:scale-[1.02] ${
                    currentWorkspace?.id === workspace.id 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg truncate">{workspace.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm truncate mt-1">
                        {workspace.description || 'No description'}
                      </p>
                    </div>
                    {workspace.isOnlyOwner && (
                      <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 border border-purple-200 dark:border-purple-700">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-gray-500 dark:text-gray-500 text-sm">
                    <span>👥 {Object.keys(workspace.members || {}).length} members</span>
                    {currentWorkspace?.id === workspace.id && (
                      <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                    )}
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h4>
                  {workspace.recentActivity && workspace.recentActivity.length > 0 ? (
                    <ul className="space-y-3">
                      {workspace.recentActivity.map((activity: any) => (
                        <li key={activity.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="mt-0.5 text-blue-500 dark:text-blue-400">•</span>
                          <span>{activity.details || 'Activity occurred'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic">No recent activity.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-gray-500 dark:text-gray-400">No workspaces found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
