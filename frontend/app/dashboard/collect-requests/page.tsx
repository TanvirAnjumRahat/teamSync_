'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface CollectionForm {
  id: string;
  name: string;
  description: string;
  project: string;
  responses: number;
  status: 'active' | 'closed';
  created: Date;
  link: string;
}

export default function CollectRequestsPage() {
  const [forms, setForms] = useState<CollectionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Simulate fetching collection forms from Firebase
    setLoading(true);
    const mockForms: CollectionForm[] = [
      {
        id: '1',
        name: 'Bug Report Form',
        description: 'Collect bug reports from users and customers',
        project: 'Cross-Team Projects',
        responses: 24,
        status: 'active',
        created: new Date(Date.now() - 30 * 86400000),
        link: 'https://teamsync.io/forms/bug-report',
      },
      {
        id: '2',
        name: 'Feature Request',
        description: 'Gather feature requests and suggestions',
        project: 'Cross-Team Projects',
        responses: 12,
        status: 'active',
        created: new Date(Date.now() - 15 * 86400000),
        link: 'https://teamsync.io/forms/feature-request',
      },
      {
        id: '3',
        name: 'Support Requests - Q1',
        description: 'Support and maintenance requests for Q1',
        project: '[Example] Timeline Tracking',
        responses: 42,
        status: 'closed',
        created: new Date(Date.now() - 90 * 86400000),
        link: 'https://teamsync.io/forms/support-q1',
      },
    ];
    setForms(mockForms);
    setLoading(false);
  }, []);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const closeForm = (id: string) => {
    setForms(
      forms.map((f) =>
        f.id === id ? { ...f, status: 'closed' } : f
      )
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Collect Requests</h1>
                <p className="text-gray-400 mt-2">
                  Create forms to collect requests and issues from users
                </p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                + New Collection Form
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="bg-gray-900 border-b border-gray-800 p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowCreate(false);
                }}
                className="max-w-2xl space-y-4"
              >
                <input
                  type="text"
                  placeholder="Form name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500">
                  <option>Select project</option>
                  <option>Cross-Team Projects</option>
                  <option>[Example] Timeline Tracking</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                  >
                    Create Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading collection forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">
                  No collection forms yet
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Create a form to start collecting requests and feedback
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  Create First Form
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className={`border rounded-lg p-6 transition ${
                      form.status === 'active'
                        ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                        : 'bg-gray-900 border-gray-700 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">
                            {form.name}
                          </h3>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              form.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {form.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {form.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-400">
                          {form.responses}
                        </p>
                        <p className="text-xs text-gray-500">responses</p>
                      </div>
                    </div>

                    {/* Form Link */}
                    <div className="bg-gray-950 rounded p-3 mb-4 flex items-center justify-between group">
                      <code className="text-sm text-gray-400 font-mono truncate">
                        {form.link}
                      </code>
                      <button
                        onClick={() => copyLink(form.link)}
                        className="ml-2 px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition text-xs font-medium opacity-0 group-hover:opacity-100"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-800 pt-4">
                      <span>{form.project}</span>
                      <span>Created {formatDate(form.created)}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium">
                        Edit Form
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition text-sm font-medium">
                        View Responses
                      </button>
                      {form.status === 'active' && (
                        <button
                          onClick={() => closeForm(form.id)}
                          className="flex-1 px-4 py-2 bg-red-900 text-red-200 rounded hover:bg-red-800 transition text-sm font-medium"
                        >
                          Close Form
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
