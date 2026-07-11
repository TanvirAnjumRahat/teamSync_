'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  completionRate: number;
  recentProjects: any[];
  recentTasks: any[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, isLoading: workspaceLoading, hasWorkspaces } = useWorkspace();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (currentWorkspace) {
      loadDashboardStats();

      // Poll stats in the background every 5 seconds for real-time updates
      const intervalId = setInterval(() => {
        loadDashboardStats(true);
      }, 5000);

      return () => clearInterval(intervalId);
    } else {
      setLoadingStats(false);
    }
  }, [currentWorkspace]);

  const loadDashboardStats = async (silent = false) => {
    if (!currentWorkspace) return;
    try {
      if (!silent) {
        setLoadingStats(true);
      }
      const response = await ApiClient.getDashboardSummary();
      if (response.success && response.data) {
        setStats(response.data as DashboardStats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      if (!silent) {
        setLoadingStats(false);
      }
    }
  };

  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!hasWorkspaces) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl text-gray-400">T</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to TeamSync AI</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            You don't have any workspaces yet. Create your first workspace to start managing your projects.
          </p>
          <button
            onClick={() => {
              const dropdown = document.querySelector('[class*="bg-gray-800 hover:bg-gray-700"]');
              if (dropdown) (dropdown as HTMLElement).click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition text-lg font-semibold"
          >
            Create Workspace
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Click the workspace selector in the top bar to get started
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl text-gray-400">T</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Select a Workspace</h2>
          <p className="text-gray-400 mb-6">
            Choose a workspace from the dropdown in the top bar to continue.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-gray-400 mt-1">
          Workspace: <span className="text-white font-medium">{currentWorkspace.name}</span>
        </p>
      </div>

      {loadingStats ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Projects</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.totalProjects || 0}</p>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-lg">
                  <span className="text-xl font-medium text-blue-300">P</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Tasks</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats?.totalTasks || 0}</p>
                </div>
                <div className="bg-purple-900/30 p-3 rounded-lg">
                  <span className="text-xl font-medium text-purple-300">T</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">{stats?.inProgressCount || 0}</p>
                </div>
                <div className="bg-yellow-900/30 p-3 rounded-lg">
                  <span className="text-xl font-medium text-yellow-300">P</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{stats?.completionRate || 0}%</p>
                </div>
                <div className="bg-green-900/30 p-3 rounded-lg">
                  <span className="text-xl font-medium text-green-300">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/projects/new"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
                >
                  Create Project
                </Link>
                <Link
                  href="/tasks/new"
                  className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition"
                >
                  Create Task
                </Link>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 lg:col-span-2">
              <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
              {stats?.recentTasks && stats.recentTasks.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentTasks.slice(0, 5).map((task: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-300 text-sm">{task.title}</span>
                      <span className="text-xs text-gray-500">{task.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No recent activity yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
