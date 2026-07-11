'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: any; // Firestore Timestamp or string
  createdBy: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
  members: Record<string, { role: string; assignedAt: Date }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (projectId && user) {
      loadProject();
    }
  }, [projectId, user, authLoading]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiClient.getProject(projectId);
      if (response.success && response.data) {
        setProject(response.data as Project);
      } else {
        setError(response.error || 'Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-900/50 text-green-400';
      case 'PAUSED': return 'bg-yellow-900/50 text-yellow-400';
      case 'COMPLETED': return 'bg-blue-900/50 text-blue-400';
      case 'ARCHIVED': return 'bg-gray-700 text-gray-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  // ✅ Helper function to format date safely
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      let date: Date;
      
      // If it's a Firestore Timestamp
      if (dateValue.toDate) {
        date = dateValue.toDate();
      } 
      // If it's a string or number
      else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
      } 
      // If it's already a Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  if (error || !project) {
    return (
      <MainLayout>
        <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          ❌ {error || 'Project not found'}
          <button
            onClick={() => router.push('/projects')}
            className="ml-4 text-blue-400 hover:text-blue-300 underline"
          >
            Back to Projects
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/projects')}
          className="text-gray-400 hover:text-white transition mb-4"
        >
          ← Back to Projects
        </button>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className="text-xs text-gray-400">
                  📅 Created {formatDate(project.createdAt)}
                </span>
              </div>
            </div>
            <Link
              href={`/projects/${projectId}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Edit Project
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            {project.description || 'No description provided'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{project.metrics?.totalTasks || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{project.metrics?.completedTasks || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-400">{project.metrics?.completionRate || 0}%</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href={`/tasks?projectId=${projectId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            View Tasks
          </Link>
          <Link
            href={`/tasks/new?projectId=${projectId}`}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
          >
            + Add Task
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
