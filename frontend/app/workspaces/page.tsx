'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkspacesPage() {
  const { workspaces, currentWorkspace, createWorkspace, isLoading, refreshWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createWorkspace(name, description);
      setShowModal(false);
      setName('');
      setDescription('');
      await refreshWorkspaces();
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-white font-bold text-lg">TeamSync AI</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Workspaces</h1>
            <p className="text-gray-400 mt-1">Create and manage your workspaces</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> New Workspace
          </button>
        </div>

        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => {
                  router.push('/dashboard');
                }}
                className="bg-gray-900 rounded-xl p-6 border-2 cursor-pointer transition hover:border-blue-500 hover:scale-[1.02] border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">{workspace.name}</h3>
                    <p className="text-gray-400 text-sm truncate mt-1">
                      {workspace.description || 'No description'}
                    </p>
                  </div>
                  {currentWorkspace?.id === workspace.id && (
                    <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center text-gray-500 text-sm">
                  <span>👥 {Object.keys(workspace.members || {}).length} members</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-gray-400">No workspaces yet. Create your first workspace!</p>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Workspace</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Workspace Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter workspace name"
                  required
                  autoFocus
                  className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setName('');
                    setDescription('');
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition"
                >
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
