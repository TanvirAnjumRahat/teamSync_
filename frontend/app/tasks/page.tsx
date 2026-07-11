'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';

interface Project {
  id: string;
  name: string;
}

function TasksPageContent() {
  const { currentWorkspace, workspaces } = useWorkspace();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔄 TasksPage mounted');
    console.log('📦 Current workspace:', currentWorkspace);
    console.log('📦 All workspaces:', workspaces);

    if (currentWorkspace) {
      loadProjects();
    } else {
      console.warn('⚠️ No current workspace – waiting...');
      setLoadingProjects(false);
    }
  }, [currentWorkspace]);

  const loadProjects = async () => {
    if (!currentWorkspace) {
      console.warn('❌ loadProjects called with no workspace');
      setLoadingProjects(false);
      return;
    }

    try {
      setLoadingProjects(true);
      setError('');
      console.log(`📡 Loading projects for workspace: ${currentWorkspace.id}`);
      
      const response = await ApiClient.getProjects(currentWorkspace.id);
      console.log('📦 Projects API response:', response);
      
      if (response.success && response.data) {
        const projectsData = response.data as any[];
        setProjects(projectsData);
        console.log(`✅ Loaded ${projectsData.length} projects`);
        
        if (projectsData.length > 0) {
          const firstProjectId = projectsData[0].id;
          setSelectedProjectId(firstProjectId);
          console.log(`📌 Auto-selected project: ${firstProjectId}`);
        } else {
          console.warn('⚠️ No projects found in this workspace');
        }
      } else {
        setError(response.error || 'Failed to load projects');
        console.error('❌ Failed to load projects:', response);
      }
    } catch (err) {
      console.error('❌ Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  // If no workspace, show message
  if (!currentWorkspace && !loadingProjects) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📂</div>
          <p className="text-gray-400">Please select a workspace from the dropdown in the top bar</p>
          <p className="text-gray-500 text-sm mt-2">You have {workspaces.length} workspace(s) available</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentWorkspace?.name || 'No workspace'} • {projects.length} projects
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <span>+</span> New Task
        </Link>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Select Project
        </label>
        {loadingProjects ? (
          <div className="text-gray-400 text-sm">Loading projects...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">Error: {error}</div>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => {
              console.log(`🔄 Project changed to: ${e.target.value}`);
              setSelectedProjectId(e.target.value);
            }}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none w-full md:w-64"
            disabled={projects.length === 0}
          >
            <option value="">{projects.length === 0 ? 'No projects available' : 'Select a project'}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        {projects.length === 0 && !loadingProjects && !error && (
          <p className="text-yellow-400 text-xs mt-1">
            No projects in this workspace. <Link href="/projects/new" className="text-blue-400 hover:underline">Create a project</Link>
          </p>
        )}
      </div>

      {/* TaskBoard */}
      {selectedProjectId ? (
        <TaskBoard projectId={selectedProjectId} searchQuery={searchQuery} />
      ) : (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-400">
            {projects.length === 0
              ? 'Create a project first to start managing tasks'
              : 'Select a project to view its tasks'}
          </p>
          {projects.length === 0 && (
            <Link
              href="/projects/new"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Create Project
            </Link>
          )}
        </div>
      )}
    </MainLayout>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    }>
      <TasksPageContent />
    </Suspense>
  );
}
