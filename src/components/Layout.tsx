import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, Menu, X, LogOut, Users, HelpCircle, Wallet } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const role = String(profile?.role || '').toLowerCase().trim();
  const isAdmin = role === 'admin';
  const isPM = role === 'manager';
  const isPC = role === 'pc';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: !isPC },
    { name: 'Daftar Project', href: '/projects', icon: FolderKanban, show: !isPC },
    { name: 'Laporan Harian', href: '/reports', icon: FileText, show: true },
    { name: 'Keuangan', href: '/finance', icon: Wallet, show: isAdmin || isPM },
    { name: 'Kelola Users', href: '/users', icon: Users, show: isAdmin },
    { name: 'Panduan', href: '/guide', icon: HelpCircle, show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">ConstructDash</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col pt-16 md:pt-0 shadow-lg md:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 items-center px-6 border-b border-gray-200 hidden md:flex">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">ConstructDash</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          {!profile && (
            <div className="mb-3 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
              Data profil sedang dimuat atau tidak ditemukan.
            </div>
          )}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold uppercase">
              {profile?.name ? profile.name.charAt(0) : '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role || 'No Role'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
