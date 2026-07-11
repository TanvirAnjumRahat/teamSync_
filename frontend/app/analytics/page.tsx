'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Track your team's productivity</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <div className="text-4xl mb-4">📈</div>
        <p className="text-gray-400">Analytics dashboard coming soon!</p>
        <p className="text-gray-500 text-sm mt-2">Track task completion, team performance, and more</p>
      </div>
    </MainLayout>
  );
}
