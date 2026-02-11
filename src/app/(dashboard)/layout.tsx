'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);

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
  ];

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-700 to-indigo-800 text-white">
        <div className="p-6">
          <div className="text-4xl mb-2">🅿️</div>
          <h1 className="text-2xl font-bold">ParkMitra</h1>
          <p className="text-purple-200 text-sm">Kolkata Parking</p>
        </div>

        <nav className="mt-6">
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

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-purple-600">
          <div className="mb-4">
            <p className="text-sm text-purple-200">Logged in as</p>
            <p className="font-medium truncate">{admin.name}</p>
            <p className="text-xs text-purple-300 truncate">{admin.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
