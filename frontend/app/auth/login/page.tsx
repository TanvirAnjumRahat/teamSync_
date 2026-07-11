'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signInWithGoogle, signInWithGitHub, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirect || '/dashboard');
    }
  }, [user, authLoading, router, redirect]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push(redirect || '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'github') {
        await signInWithGitHub();
      }
      router.push(redirect || '/dashboard');
    } catch (err) {
      if (err instanceof Error && !err.message.includes('popup-closed')) {
        setError(err.message || `${provider} sign-in failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center p-8">
        <div className="relative w-full h-full flex items-center justify-center text-center">
          <div className="space-y-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition">
              <span className="text-5xl font-bold text-white">T</span>
            </div>
            
            <div>
              <h2 className="text-4xl font-bold text-white mb-3">TeamSync AI</h2>
              <p className="text-lg text-gray-400">Collaborative Task Management</p>
              <p className="text-gray-500 text-sm mt-2">Empower your team. Accomplish more together.</p>
            </div>

            <div className="pt-8 border-t border-gray-700">
              <p className="text-gray-500 text-sm mb-4">Welcome back! Login to continue</p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">👥</span>
                  </div>
                  <p className="text-gray-400 text-xs">Team Collaboration</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">✓</span>
                  </div>
                  <p className="text-gray-400 text-xs">Task Management</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg">🤖</span>
                  </div>
                  <p className="text-gray-400 text-xs">AI Insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto bg-gray-900">
        <div className="w-full max-w-md py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-400">Welcome back to TeamSync AI</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-gray-300 text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-gray-900 text-white placeholder-gray-600 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full bg-gray-900 text-white placeholder-gray-600 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900 transition"
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center text-gray-400 text-sm">
                <input type="checkbox" className="mr-2 bg-gray-900 border-gray-700 rounded" />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm transition">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="mb-4 bg-red-900 bg-opacity-20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black font-semibold py-3 px-4 rounded-lg transition mb-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-700 border border-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition mb-3 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-700 border border-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link href={redirect ? `/auth/signup?redirect=${encodeURIComponent(redirect)}` : "/auth/signup"} className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Sign In...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
