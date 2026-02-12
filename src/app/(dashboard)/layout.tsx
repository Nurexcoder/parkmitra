'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminData = localStorage.getItem('admin');

    if (!token) {
      router.push('/login');
      return;
    }

    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, [router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/entry', label: 'Entry', icon: '🚗' },
    { href: '/exit', label: 'Exit', icon: '🚙' },
    { href: '/riders', label: 'Riders', icon: '👥' },
    { href: '/settings/admins', label: 'Admins', icon: '🛡️' },
    { href: '/settings/password', label: 'Settings', icon: '⚙️' },
  ];

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🅿️</div>
          <h1 className="text-xl font-bold">ParkMitra</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar - Desktop: Always visible, Mobile: Conditional */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-700 to-indigo-800 text-white z-40 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header (Hidden on Mobile since we have top bar) */}
          <div className="hidden md:block p-6">
            <div className="text-4xl mb-2">🅿️</div>
            <h1 className="text-2xl font-bold">ParkMitra</h1>
            <p className="text-purple-200 text-sm">Kolkata Parking</p>
          </div>

          {/* Navigation Items */}
          <nav className="mt-24 md:mt-6 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-colors ${
                  pathname === item.href ? 'bg-white bg-opacity-20 border-r-4 border-white' : ''
                }`}
              >
                <span className="text-2xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-6 border-t border-purple-600 bg-purple-800/50">
            <div className="mb-4">
              <p className="text-sm text-purple-200">Logged in as</p>
              <p className="font-medium truncate">{admin.name}</p>
              <p className="text-xs text-purple-300 truncate">{admin.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-gray-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
