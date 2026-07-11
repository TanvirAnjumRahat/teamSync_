'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  status: 'active' | 'inactive';
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: number;
  projects: number;
  owner: string;
  created: Date;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    // Simulate fetching teams from Firebase
    setLoading(true);
    const mockTeams: Team[] = [
      {
        id: '1',
        name: 'Development Team',
        description: 'Core development and engineering team',
        members: 8,
        projects: 5,
        owner: user?.displayName || 'You',
        created: new Date(Date.now() - 180 * 86400000),
      },
      {
        id: '2',
        name: 'Product Team',
        description: 'Product management and strategy',
        members: 5,
        projects: 3,
        owner: 'Product Lead',
        created: new Date(Date.now() - 120 * 86400000),
      },
      {
        id: '3',
        name: 'QA & Testing',
        description: 'Quality assurance and testing team',
        members: 4,
        projects: 2,
        owner: 'QA Lead',
        created: new Date(Date.now() - 90 * 86400000),
      },
    ];

    const mockMembers: TeamMember[] = [
      {
        id: '1',
        name: 'You',
        email: user?.email || 'user@example.com',
        role: 'admin',
        joinedAt: new Date(Date.now() - 180 * 86400000),
        status: 'active',
      },
      {
        id: '2',
        name: 'John Developer',
        email: 'john@example.com',
        role: 'member',
        joinedAt: new Date(Date.now() - 150 * 86400000),
        status: 'active',
      },
      {
        id: '3',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'member',
        joinedAt: new Date(Date.now() - 120 * 86400000),
        status: 'active',
      },
      {
        id: '4',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'viewer',
        joinedAt: new Date(Date.now() - 30 * 86400000),
        status: 'inactive',
      },
    ];

    setTeams(mockTeams);
    setTeamMembers(mockMembers);
    setSelectedTeam(mockTeams[0].id);
    setLoading(false);
  }, [user?.displayName, user?.email]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400';
      case 'member':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const selectedTeamData = teams.find((t) => t.id === selectedTeam);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-gray-950 border-b border-gray-800 p-6 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Teams</h1>
                <p className="text-gray-400 mt-2">Manage team members and permissions</p>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                + New Team
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading teams...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Teams List */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Your Teams
                  </h3>
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team.id)}
                        className={`w-full text-left px-4 py-3 rounded transition ${
                          selectedTeam === team.id
                            ? 'bg-blue-700 text-white'
                            : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {team.members} members
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Details */}
                {selectedTeamData && (
                  <div className="lg:col-span-3 space-y-6">
                    {/* Team Info */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            {selectedTeamData.name}
                          </h2>
                          <p className="text-gray-400 mt-2">
                            {selectedTeamData.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowInvite(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                        >
                          + Invite Member
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
                        <div>
                          <p className="text-gray-500 text-sm">Members</p>
                          <p className="text-2xl font-bold text-white">
                            {selectedTeamData.members}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Projects</p>
                          <p className="text-2xl font-bold text-white">
                            {selectedTeamData.projects}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Owner</p>
                          <p className="text-white">{selectedTeamData.owner}</p>
                        </div>
                      </div>
                    </div>

                    {/* Invite Form */}
                    {showInvite && (
                      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setShowInvite(false);
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="email"
                            placeholder="Enter email address"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                          <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500">
                            <option>Member</option>
                            <option>Admin</option>
                            <option>Viewer</option>
                          </select>
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                            >
                              Send Invite
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowInvite(false)}
                              className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Members List */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-800">
                        <h3 className="text-lg font-semibold text-white">
                          Team Members
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-800">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="p-6 flex items-center justify-between hover:bg-gray-800 transition"
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                                {member.name[0]}
                              </div>
                              <div>
                                <p className="text-white font-medium">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleColor(
                                  member.role
                                )}`}
                              >
                                {member.role}
                              </span>
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  member.status === 'active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {member.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
