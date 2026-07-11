'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClient } from '@/lib/api';

function InvitePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const response = await ApiClient.getInvitation(token || '');
        if (response.success) {
          setInvitation(response.data);
        } else {
          setError(response.error || 'Invalid invitation');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Redirect to login only if NOT authenticated AND we have an invitation
  useEffect(() => {
    if (!authLoading && !user && invitation) {
      // Save token to session storage for after login
      sessionStorage.setItem('inviteToken', token || '');
      const redirectUrl = `/auth/login?redirect=/invite?token=${token}`;
      router.push(redirectUrl);
    }
  }, [authLoading, user, invitation, token, router]);

  const handleAccept = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setAccepting(true);
    try {
      const response = await ApiClient.acceptInvitation(token || '');
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    try {
      await ApiClient.declineInvitation(token || '');
      router.push('/dashboard');
    } catch (err: any) {
      setError('Failed to decline invitation');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-gray-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show the accept/decline page
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full border border-gray-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Workspace Invitation</h2>
          <p className="text-gray-400 text-sm mt-1">You've been invited to join a workspace</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400 text-sm">Workspace</span>
            <span className="text-white font-medium">{invitation?.workspaceName || 'Unknown'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400 text-sm">Role</span>
            <span className="text-blue-400">{invitation?.role || 'MEMBER'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400 text-sm">Invited By</span>
            <span className="text-gray-300">{invitation?.invitedBy || 'Admin'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition font-semibold"
          >
            {accepting ? 'Accepting...' : '✅ Accept'}
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition font-semibold"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}
