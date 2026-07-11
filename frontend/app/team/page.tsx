'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentWorkspace?.name} • {Object.keys(currentWorkspace?.members || {}).length} members
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2">
          <span>+</span> Invite Members
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <div className="text-4xl mb-4">👥</div>
        <p className="text-gray-400">Team management coming soon!</p>
        <p className="text-gray-500 text-sm mt-2">Invite team members and manage roles</p>
      </div>
    </MainLayout>
  );
}
