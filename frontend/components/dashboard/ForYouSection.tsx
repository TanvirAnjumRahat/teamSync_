// frontend/components/dashboard/ForYouSection.tsx
'use client';

import { useEffect, useState } from 'react';
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
  projects: any[];
}

export function ForYouSection() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.getDashboardSummary();
      if (response.success && response.data) {
        setStats(response.data as DashboardStats);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalProjects || 0}</p>
            </div>
            <div className="bg-blue-900 bg-opacity-30 p-3 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalTasks || 0}</p>
            </div>
            <div className="bg-purple-900 bg-opacity-30 p-3 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tasks In Progress</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats?.inProgressCount || 0}</p>
            </div>
            <div className="bg-yellow-900 bg-opacity-30 p-3 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats?.completionRate || 0}%</p>
            </div>
            <div className="bg-green-900 bg-opacity-30 p-3 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Tasks</h3>
          {stats?.recentTasks?.length === 0 ? (
            <p className="text-gray-400 text-sm">No tasks assigned to you yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentTasks?.slice(0, 5).map((task: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{task.title}</p>
                    <p className="text-gray-400 text-sm">
                      {task.status?.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                    task.priority === 'URGENT' ? 'bg-red-900 text-red-300' :
                    task.priority === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                    task.priority === 'MEDIUM' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
          {(stats?.totalTasks ?? 0) > 0 && (
            <Link href="/tasks" className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block">
              View all tasks →
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/projects/new"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              + Create New Project
            </Link>
            <Link
              href="/tasks/new"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              + Create New Task
            </Link>
            <Link
              href="/analytics"
              className="block w-full text-center border border-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              📊 View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
