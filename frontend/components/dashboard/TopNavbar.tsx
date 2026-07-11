'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function TopNavbar() {
  const { user } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      await createWorkspace(newWorkspaceName, newWorkspaceDescription);
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;

    setIsInviting(true);
    setInviteStatus(null);
    try {
      const response = await fetch(`http://localhost:5002/api/workspaces/${currentWorkspace.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await response.json();
      
      if (data.success) {
        setInviteStatus({ type: 'success', msg: `Invitation sent to ${inviteEmail}` });
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteStatus(null);
        }, 2000);
      } else {
        setInviteStatus({ type: 'error', msg: data.error || 'Failed to send invite' });
      }
    } catch (error: any) {
      setInviteStatus({ type: 'error', msg: error.message || 'Failed to send invite' });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800 h-16 flex items-center px-4 sticky top-0 z-40">
        <div className="flex-1 flex items-center justify-between">
          {/* Left: Workspace Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition min-w-[180px]"
              >
                <span className="font-medium truncate">
                  {currentWorkspace?.name || (workspaces.length > 0 ? 'Select Workspace' : 'No Workspace')}
                </span>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showWorkspaceMenu && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  {workspaces.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                        Workspaces
                      </div>
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            switchWorkspace(ws.id);
                            setShowWorkspaceMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition flex items-center justify-between ${
                            currentWorkspace?.id === ws.id ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                          }`}
                        >
                          <span>{ws.name}</span>
                          {currentWorkspace?.id === ws.id && (
                            <span className="text-xs text-green-400">✓</span>
                          )}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      No workspaces yet. Create one!
                    </div>
                  )}

                  <div className="border-t border-gray-700 my-1"></div>

                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <span>+</span> Create Workspace
                  </button>
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      router.push('/workspaces');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 transition"
                  >
                    Manage Workspaces
                  </button>
                </div>
              )}
            </div>

            {currentWorkspace && (
              <span className="text-xs text-gray-500 hidden sm:block">
                {Object.keys(currentWorkspace.members || {}).length} members
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {((pathname === '/tasks' || pathname === '/projects') || (pathname?.startsWith('/workspaces') && (pathname?.endsWith('/tasks') || pathname?.endsWith('/projects')))) && (
              <div className="w-48 sm:w-64 mr-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    defaultValue={searchParams.get('search') || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const params = new URLSearchParams(window.location.search);
                      if (val) {
                        params.set('search', val);
                      } else {
                        params.delete('search');
                      }
                      router.push(`${pathname}?${params.toString()}`);
                    }}
                    placeholder={pathname.includes('/tasks') ? 'Search tasks...' : 'Search projects...'}
                    className="w-full border border-gray-700 rounded-lg pl-10 pr-4 py-1.5 focus:outline-none focus:border-blue-500 text-xs"
                    style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
                  />
                </div>
              </div>
            )}

            {/* Invite Button */}
            {currentWorkspace && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="relative text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-800"
                title="Invite to Workspace"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
            )}


            {/* Notification Bell */}
            <button className="relative text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-gray-800 p-1.5 rounded-lg transition"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-white text-sm font-medium">{user?.displayName}</p>
                    <p className="text-gray-400 text-xs">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition border-t border-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  required
                  autoFocus
                  className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWorkspaceName('');
                    setNewWorkspaceDescription('');
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && currentWorkspace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Invite to {currentWorkspace.name}</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteStatus && (
                <div className={`p-3 rounded-lg text-sm ${inviteStatus.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                  {inviteStatus.msg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="MEMBER">Member</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
