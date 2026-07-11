'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ApiClient } from '@/lib/api';

export default function CreateProjectPage() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const router = useRouter();
  
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default workspace when component loads
  useEffect(() => {
    if (currentWorkspace) {
      setSelectedWorkspaceId(currentWorkspace.id);
    } else if (workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [currentWorkspace, workspaces]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    // Optionally switch the current workspace context
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      switchWorkspace(workspaceId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkspaceId) {
      setError('Please select a workspace');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ApiClient.createProject(selectedWorkspaceId, {
        name,
        description,
        status,
        deadline: deadline || undefined,
      });
      
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Project</h1>
            <p className="text-gray-400 text-sm mt-1">Add a new project to your workspace</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 rounded-xl p-6 border border-gray-800">
          {/* Workspace Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Workspace <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select a workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-1">
              {workspaces.length === 0 && 'Create a workspace first from the top bar'}
            </p>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Describe the project"
            />
          </div>

          {/* Status & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedWorkspaceId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
