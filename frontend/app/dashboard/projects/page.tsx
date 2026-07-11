'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { db, auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import ApiClient from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  ownerId: string;
  teamMembers?: string[];
  status: 'ACTIVE' | 'PAUSED' | 'ON_HOLD' | 'ARCHIVED';
  taskCount?: number;
  completedCount?: number;
  isArchived?: boolean;
  createdAt: Date;
}

interface ProjectFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const PROJECT_ICONS = ['📁', '🎯', '📊', '🚀', '⚙️', '🔧', '💡', '📱', '🌐', '📈'];
const PROJECT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({ name: '', description: '', icon: '📁', color: '#3b82f6' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: Project[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          icon: data.icon || '📁',
          color: data.color || '#3b82f6',
          ownerId: data.ownerId,
          teamMembers: data.teamMembers || [user.uid],
          status: data.status || 'ACTIVE',
          taskCount: data.taskCount || 0,
          completedCount: data.completedCount || 0,
          isArchived: data.isArchived !== true,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });
      setProjects(projectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'ARCHIVED') return p.isArchived === false;
    if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE' && !p.isArchived;
    return true;
  });

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name  is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
      };

      if (editingId) {
        await ApiClient.updateProject(editingId, payload);
      } else {
        await ApiClient.createUserProject(payload);
      }

      setSuccess(editingId ? 'Project updated!' : 'Project created!');
      setFormData({ name: '', description: '', icon: '📁', color: '#3b82f6' });
      setShowForm(false);
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description,
      icon: project.icon || '📁',
      color: project.color || '#3b82f6',
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    try {
      await ApiClient.deleteProject(projectId);

      setSuccess('Project deleted!');
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setDeleteConfirm(null);
    }
  };

  const handleArchive = async (projectId: string) => {
    try {
      await ApiClient.archiveProject(projectId);

      setSuccess('Project archived!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-100 mb-2">Projects</h1>
                <p className="text-gray-400">Manage your team projects and collaboration</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setFormData({ name: '', description: '', icon: '📁', color: '#3b82f6' });
                  setEditingId(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                + New Project
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading projects...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-700 transition group"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-2">{project.icon}</div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description}</p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                      title={`Color: ${project.color}`}
                    ></div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">📌 Tasks</span>
                      <span className="font-semibold text-blue-400">{project.taskCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">👥 Members</span>
                      <span className="font-semibold text-green-400">{project.teamMembers?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          project.status === 'ACTIVE'
                            ? 'bg-green-900/30 text-green-400'
                            : project.status === 'PAUSED'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleArchive(project.id)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded transition"
                    >
                      📦 Archive
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(project.id)}
                      className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm font-semibold py-2 rounded transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No projects yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create your first project
              </button>
            </div>
          )}

          {/* Create/Edit Project Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 dark:bg-white/50 dark:bg-black/50">
              <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {editingId ? 'Edit Project' : 'New Project'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Project Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Marketing Campaign"
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Project description..."
                      rows={3}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                    />
                  </div>

                  {/* Icon & Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">Icon</label>
                      <div className="grid grid-cols-5 gap-2">
                        {PROJECT_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, icon });
                            }}
                            className={`text-2xl p-2 rounded-lg transition ${
                              formData.icon === icon
                                ? 'bg-blue-600'
                                : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, color });
                            }}
                            className={`w-full aspect-square rounded-lg transition ${
                              formData.color === color ? 'ring-2 ring-white' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          ></button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({ name: '', description: '', icon: '📁', color: '#3b82f6' });
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      {submitting ? 'Saving...' : 'Save Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 dark:bg-white/50 dark:bg-black/50">
              <div className="bg-gray-900 border border-red-900 rounded-lg max-w-sm w-full p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Delete Project?</h2>
                <p className="text-gray-400 mb-6">
                  This will permanently delete the project and all associated tasks. This action cannot be undone.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
