'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[400px] right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-zinc-900 bg-black/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent tracking-tight">
              TeamSync AI
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="/auth/login" 
              className="text-zinc-400 hover:text-white font-medium text-sm transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm px-4 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all duration-200 shadow-md shadow-black/40"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-semibold text-indigo-400 mb-6 shadow-inner animate-pulse">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 3.8L19.2 19H4.8L12 5.8z"/>
          </svg>
          Powered by Gemini AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Sync Your Team. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Automate with AI.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
          The next-generation productivity hub that unites issues, tasks, and code. Supercharge your workspace with real-time sync and smart AI suggestions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            href="/auth/signup" 
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-center"
          >
            Get Started Free
          </Link>
          <Link 
            href="/auth/login" 
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold transition-all duration-300 text-center"
          >
            Sign In with Email
          </Link>
        </div>

        {/* Board Mockup Preview */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-zinc-500 font-mono">TeamSync Workspace</span>
            </div>
            <div className="w-24 h-4 bg-zinc-900 rounded-md" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-black border border-zinc-900">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">To Do</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 font-mono">3</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 shadow">
                  <div className="text-xs font-semibold text-indigo-400 mb-1">DESIGN</div>
                  <div className="text-sm font-medium mb-2 text-zinc-200">Refine landing page details</div>
                  <div className="h-1.5 w-1/3 bg-zinc-900 rounded-full" />
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 shadow opacity-70">
                  <div className="text-xs font-semibold text-purple-400 mb-1">INTEGRATION</div>
                  <div className="text-sm font-medium mb-2 text-zinc-200">Connect GitHub hook API</div>
                  <div className="h-1.5 w-1/2 bg-zinc-900 rounded-full" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-900">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">In Progress</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-400 font-mono">1</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-indigo-500/30 shadow shadow-indigo-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI Suggestion</span>
                  <span className="text-[10px] text-red-400 font-bold bg-red-950/40 px-1 py-0.5 rounded">HIGH</span>
                </div>
                <div className="text-sm font-medium mb-2 text-zinc-100">Fix auth routing & middleware</div>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">Redirection rules need validation check during user session load...</p>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-900 text-[10px] text-zinc-500">
                  <span>Updated 2m ago</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold">AI</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-900">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Done</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-mono">8</span>
              </div>
              <div className="space-y-3 opacity-60">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 shadow line-through text-zinc-500">
                  <div className="text-sm font-medium mb-1">Setup project workspace layout</div>
                  <div className="h-1.5 w-1/4 bg-zinc-900 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need to ship.</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">Discover modern, collaborative tools designed to boost productivity across your entire development lifecycle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.97-8.97m-8.97 8.97a9.003 9.003 0 01-5.187-8.23c0-3.485 1.976-6.513 4.87-8.024M17.063 7.904L18 3l-8.97 8.97m8.97-8.97a9.003 9.003 0 015.187 8.23c0 3.485-1.976 6.513-4.87 8.024" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Gemini AI Assistance</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Instantly compute issue priority and generate summaries based on user input, saving precious minutes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-purple-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Interactive Kanban</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Manage your tasks effortlessly with customizable drag-and-drop boards that update in real-time.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-pink-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Detailed Analytics</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Track completion rates, active work distribution, and sprint speed with built-in charts.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Repository Connection</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Import and connect your Git repository metadata directly to link issues with commits.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Social Proof Stats */}
      <section className="bg-zinc-950/50 border-t border-b border-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-4xl font-extrabold text-white mb-2 font-mono">10x</div>
            <div className="text-zinc-400 text-sm">Faster Sprint Planning</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white mb-2 font-mono">99.9%</div>
            <div className="text-zinc-400 text-sm">Real-Time Sync SLA</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white mb-2 font-mono">10k+</div>
            <div className="text-zinc-400 text-sm">Automated Tasks Tracked</div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="max-w-5xl mx-auto px-6 py-28 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-8 md:p-16 rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm relative overflow-hidden">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Ready to sync your team?</h2>
          <p className="text-zinc-400 text-base max-w-lg mx-auto mb-8">
            Create an account and start managing your workspace, tasks, and team with built-in AI in less than 2 minutes.
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold transition-all duration-200 shadow-lg shadow-white/5"
          >
            Start Free Now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 text-center text-sm text-zinc-500">
        <div>&copy; {new Date().getFullYear()} TeamSync AI. All rights reserved.</div>
      </footer>
    </div>
  );
}
