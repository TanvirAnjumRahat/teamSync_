'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Workspace Settings */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Workspace Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Workspace Name</span>
                <span className="text-white">{currentWorkspace?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Workspace ID</span>
                <span className="text-gray-500 text-sm">{currentWorkspace?.id || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Members</span>
                <span className="text-white">
                  {currentWorkspace ? Object.keys(currentWorkspace.members || {}).length : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Display Name</span>
                <span className="text-white">{user?.displayName || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Role</span>
                <span className="text-blue-400">Member</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-900/10 rounded-xl p-6 border border-red-800">
            <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm">
              Leave Workspace
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
