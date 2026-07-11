'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/dashboard/MainLayout';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';



export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [deadline, setDeadline] = useState('');
  
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [canModifyMembers, setCanModifyMembers] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        const data = response.data as any;
        setName(data.name || '');
        setDescription(data.description || '');
        setStatus(data.status || 'ACTIVE');
        
        // ✅ FIX: Properly handle deadline
        if (data.deadline) {
          // If deadline is a Firestore Timestamp
          if (data.deadline.toDate) {
            const date = data.deadline.toDate();
            setDeadline(date.toISOString().split('T')[0]);
          } 
          // If deadline is a string
          else if (typeof data.deadline === 'string') {
            const date = new Date(data.deadline);
            if (!isNaN(date.getTime())) {
              setDeadline(date.toISOString().split('T')[0]);
            } else {
              setDeadline('');
            }
          }
        } else {
          setDeadline('');
        }

        // Fetch workspace members
        if (data.workspaceId) {
          try {
            const membersRes = await ApiClient.getWorkspaceMembers(data.workspaceId);
            if (membersRes.success && membersRes.data) {
              const membersData = membersRes.data as any[];
              setWorkspaceMembers(membersData);

              // Check permission
              const currentUserMember = membersData.find(m => m.id === user?.uid);
              if (currentUserMember && ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUserMember.role)) {
                setCanModifyMembers(true);
              } else {
                setCanModifyMembers(false);
              }
            }
          } catch (err) {
            console.error('Failed to load workspace members:', err);
          }
        }

        // Initialize selected members
        if (data.members) {
          setSelectedMembers(Object.keys(data.members));
        }

      } else {
        setError(response.error || 'Failed to load project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        name,
        description,
        status,
      };
      
      // Only include deadline if it has a value
      if (deadline) {
        updateData.deadline = deadline;
      } else {
        updateData.deadline = null;
      }

      await ApiClient.updateProject(projectId, updateData);
      await ApiClient.updateProjectMembers(projectId, selectedMembers);
      
      setSuccess('Project updated successfully!');
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
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

  if (error && !name) {
    return (
      <MainLayout>
        <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          ❌ {error}
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Project</h1>
            <p className="text-gray-400 text-sm mt-1">Update project details</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

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
              {deadline && (
                <p className="text-gray-500 text-xs mt-1">
                  Deadline set to: {new Date(deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Project Members */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-medium mb-4">Project Members</h3>
            {canModifyMembers ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-left text-gray-300 flex justify-between items-center focus:outline-none focus:border-blue-500"
                >
                  <span>
                    {selectedMembers.length === 0
                      ? 'Select members...'
                      : `${selectedMembers.length} member(s) selected`}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {workspaceMembers.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm">No members found in this workspace.</p>
                    ) : (
                      workspaceMembers.map(member => (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers(prev => [...prev, member.id]);
                              } else {
                                setSelectedMembers(prev => prev.filter(id => id !== member.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                              {member.displayName || member.email}
                            </span>
                            <span className="text-xs text-gray-500">{member.email}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMembers.map(id => {
                  const member = workspaceMembers.find(m => m.id === id);
                  if (!member) return null;
                  return (
                    <div key={id} className="text-gray-300 text-sm bg-gray-900 px-3 py-2 rounded border border-gray-800">
                      {member.displayName || member.email}
                    </div>
                  );
                })}
                {selectedMembers.length === 0 && (
                  <p className="text-gray-500 text-sm">No members assigned.</p>
                )}
                <p className="text-xs text-yellow-500 mt-2">Only Workspace Owners, Admins, or Managers can modify project members.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2.5 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
