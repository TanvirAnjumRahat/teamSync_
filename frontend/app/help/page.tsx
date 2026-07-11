'use client';

import { MainLayout } from '@/components/dashboard/MainLayout';

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Help & Support</h1>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-2">📖 Getting Started</h2>
            <p className="text-gray-400 text-sm">
              Welcome to TeamSync AI! Here's how to get started:
            </p>
            <ol className="list-decimal list-inside text-gray-400 text-sm mt-2 space-y-1">
              <li>Create a workspace from the dropdown in the top bar</li>
              <li>Create your first project</li>
              <li>Add tasks to your project</li>
              <li>Invite team members to collaborate</li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-2">🤖 AI Features</h2>
            <p className="text-gray-400 text-sm">
              TeamSync AI uses Gemini AI to help you:
            </p>
            <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1">
              <li>Analyze task descriptions</li>
              <li>Suggest priorities</li>
              <li>Estimate task hours</li>
              <li>Recommend labels</li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-2">📧 Need More Help?</h2>
            <p className="text-gray-400 text-sm">
              Contact us at: <span className="text-blue-400">support@teamsync.ai</span>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
