// frontend/components/dashboard/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'Tasks', href: '/tasks', icon: '✅' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Team', href: '/team', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 border-b border-gray-800 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-white font-bold text-lg hidden sm:block">TeamSync AI</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-gray-300 text-sm">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
                  {userRole}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition text-sm px-3 py-1 rounded-lg hover:bg-gray-800"
              >
                Logout
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-lg text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              <div className="px-3 py-2 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-gray-500 text-xs">{userRole}</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
