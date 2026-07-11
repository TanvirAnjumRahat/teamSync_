'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}! 👋
        </h2>
        <p className="text-gray-400 mt-1">
          Workspace: <span className="text-white font-medium">{currentWorkspace?.name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-white mt-1">0</p>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-white mt-1">0</p>
            </div>
            <div className="bg-purple-900/30 p-3 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">0</p>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-green-400 mt-1">0%</p>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/projects/new"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              + Create Project
            </Link>
            <Link
              href="/tasks/new"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              + Create Task
            </Link>
            <Link
              href="/settings"
              className="block w-full text-center border border-gray-700 hover:bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              ⚙️ Workspace Settings
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">No recent activity yet.</p>
            <p className="text-gray-500 text-xs">Start by creating your first project or task!</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
