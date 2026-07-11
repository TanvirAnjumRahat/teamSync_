'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'BUG' | 'FEATURE' | 'ENHANCEMENT' | 'DOCUMENTATION';
  assigneeId?: string;
  reportedById: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IssueFormData {
  projectId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'BUG' | 'FEATURE' | 'ENHANCEMENT' | 'DOCUMENTATION';
}

export default function IssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | Issue['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Issue['priority']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Issue['type']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IssueFormData>({
    projectId: 'default-project',
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'BUG',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const q = query(collection(db, 'issues'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData: Issue[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        issuesData.push({
          id: doc.id,
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: data.status || 'OPEN',
          priority: data.priority || 'MEDIUM',
          type: data.type || 'BUG',
          assigneeId: data.assigneeId,
          reportedById: data.reportedById,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      setIssues(issuesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
    return true;
  });

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Issue title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/issues/${editingId}` : '/api/issues';
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save issue');

      setSuccess(editingId ? 'Issue updated!' : 'Issue created!');
      setFormData({
        projectId: 'default-project',
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'BUG',
      });
      setShowForm(false);
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (issue: Issue) => {
    setFormData({
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      type: issue.type,
    });
    setEditingId(issue.id);
    setShowForm(true);
  };

  const handleDelete = async (issueId: string) => {
    const token = await auth.currentUser?.getIdToken();

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete issue');

      setSuccess('Issue deleted!');
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete issue');
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: Issue['status']) => {
    const token = await auth.currentUser?.getIdToken();

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      setSuccess('Status updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
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
                <h1 className="text-4xl font-bold text-gray-100 mb-2">Issues</h1>
                <p className="text-gray-400">Report and track bugs and feature requests</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setFormData({
                    projectId: 'default-project',
                    title: '',
                    description: '',
                    priority: 'MEDIUM',
                    type: 'BUG',
                  });
                  setEditingId(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                + Report Issue
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Total Issues</p>
                <p className="text-3xl font-bold text-white mt-2">{issues.length}</p>
              </div>
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Open</p>
                <p className="text-3xl font-bold text-red-400 mt-2">
                  {issues.filter((i) => i.status === 'OPEN').length}
                </p>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {issues.filter((i) => i.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm font-semibold">Resolved</p>
                <p className="text-3xl font-bold text-green-400 mt-2">
                  {issues.filter((i) => i.status === 'RESOLVED').length}
                </p>
              </div>
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

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Types</option>
                <option value="BUG">🐛 Bug</option>
                <option value="FEATURE">✨ Feature</option>
                <option value="ENHANCEMENT">⚡ Enhancement</option>
                <option value="DOCUMENTATION">📚 Documentation</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading issues...</p>
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-700 transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {issue.type === 'BUG'
                            ? '🐛'
                            : issue.type === 'FEATURE'
                              ? '✨'
                              : issue.type === 'ENHANCEMENT'
                                ? '⚡'
                                : '📚'}
                        </span>
                        <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition">
                          {issue.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm">{issue.description}</p>
                    </div>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value as Issue['status'])}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ml-4 ${
                        issue.status === 'OPEN'
                          ? 'bg-red-900/30 text-red-400 border-red-700'
                          : issue.status === 'IN_PROGRESS'
                            ? 'bg-blue-900/30 text-blue-400 border-blue-700'
                            : issue.status === 'CLOSED'
                              ? 'bg-gray-800 text-gray-400 border-gray-700'
                              : 'bg-green-900/30 text-green-400 border-green-700'
                      }`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          issue.priority === 'LOW'
                            ? 'text-blue-400 bg-blue-900/20'
                            : issue.priority === 'MEDIUM'
                              ? 'text-yellow-400 bg-yellow-900/20'
                              : issue.priority === 'HIGH'
                                ? 'text-orange-400 bg-orange-900/20'
                                : 'text-red-400 bg-red-900/20'
                        }`}
                      >
                        {issue.priority}
                      </div>
                      <span className="text-xs text-gray-500">
                        Created {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(issue)}
                        className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(issue.id)}
                        className="text-sm px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No issues found</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create your first issue
              </button>
            </div>
          )}

          {/* Create/Edit Issue Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 dark:bg-white/50 dark:bg-black/50">
              <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {editingId ? 'Edit Issue' : 'Report Issue'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Issue Title */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Login button not working"
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the issue..."
                      rows={3}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                    />
                  </div>

                  {/* Priority & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value as Issue['priority'] })
                        }
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Issue['type'] })}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition"
                      >
                        <option value="BUG">Bug</option>
                        <option value="FEATURE">Feature</option>
                        <option value="ENHANCEMENT">Enhancement</option>
                        <option value="DOCUMENTATION">Documentation</option>
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({
                          projectId: 'default-project',
                          title: '',
                          description: '',
                          priority: 'MEDIUM',
                          type: 'BUG',
                        });
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
                      {submitting ? 'Saving...' : 'Save Issue'}
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
                <h2 className="text-2xl font-bold text-white mb-2">Delete Issue?</h2>
                <p className="text-gray-400 mb-6">
                  This will permanently delete the issue and all its comments. This action cannot be undone.
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
