'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center gap-6 mb-8">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.displayName || 'User'}</h2>
              <p className="text-gray-400">{user?.email}</p>
              <span className="inline-block mt-2 bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full">
                Member
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Display Name</span>
              <span className="text-white">{user?.displayName || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Email Verified</span>
              <span className={user?.emailVerified ? 'text-green-400' : 'text-yellow-400'}>
                {user?.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
