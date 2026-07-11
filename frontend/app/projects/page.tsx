'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
}

function ProjectsPageContent() {
  const { currentWorkspace, workspaces } = useWorkspace();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (currentWorkspace) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const loadProjects = async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiClient.getProjects(currentWorkspace.id);
      if (response.success && response.data) {
        setProjects(response.data as Project[]);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </MainLayout>
    );
  }

  if (!currentWorkspace) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl text-gray-400">T</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Workspace Selected</h3>
          <p className="text-gray-400 max-w-md">
            Please select a workspace from the dropdown in the top bar to view projects.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            You have {workspaces.length} workspace(s) available
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 border border-red-800">
            <span className="text-3xl text-red-400">!</span>
          </div>
          <h3 className="text-xl font-semibold text-red-400 mb-2">Failed to Load Projects</h3>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => loadProjects()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">
              {currentWorkspace.name} • 0 projects
            </p>
          </div>
          <Link
            href="/projects/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> New Project
          </Link>
        </div>

        <div className="bg-gray-900 rounded-xl p-16 text-center border border-gray-800">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-gray-500">T</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
          <p className="text-gray-400 mb-4">
            Create your first project in <span className="text-white font-medium">{currentWorkspace.name}</span>
          </p>
          <Link
            href="/projects/new"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Create Project
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentWorkspace.name} • {filteredProjects.length} projects
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <span>+</span> New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => window.location.href = `/projects/${project.id}`}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition">
                {project.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            <p className="text-gray-400 text-sm mt-2 line-clamp-2">
              {project.description || 'No description'}
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>{project.metrics?.totalTasks || 0} tasks</span>
              <span>{project.metrics?.completionRate || 0}% done</span>
            </div>

            <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${project.metrics?.completionRate || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
}
