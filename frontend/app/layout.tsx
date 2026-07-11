import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TeamSync AI',
  description: 'Smart IT Productivity & Issue Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
