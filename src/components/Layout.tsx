import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FileText, Menu, X, LogOut, Users, HelpCircle, Wallet, HardHat, Settings, Bell } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, Notification } from '../lib/db';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { ThemeToggle } from './ThemeToggle';
import { useTenant } from '../lib/tenant';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const role = String(profile?.role || '').toLowerCase().trim();
  const isAdmin = role === 'admin';
  const isPM = role === 'manager';
  const isPC = role === 'pc';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!profile?.uid || !profile?.tenantId) return;

    const q = query(
      collection(db, 'notifications'),
      where('tenantId', '==', profile.tenantId),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Notification)));
    });

    return () => unsub();
  }, [profile]);

  const markAsRead = async (id: string | undefined) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(
      unread.map(n => n.id ? updateDoc(doc(db, 'notifications', n.id), { isRead: true }) : Promise.resolve())
    );
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: !isPC },
    { name: 'Daftar Project', href: '/projects', icon: FolderKanban, show: !isPC },
    { name: 'Laporan Harian', href: '/reports', icon: FileText, show: true },
    { name: 'Keuangan', href: '/finance', icon: Wallet, show: isAdmin || isPM },
    { name: 'Kelola Users', href: '/users', icon: Users, show: isAdmin },
    { name: 'Pengaturan', href: '/settings', icon: Settings, show: isAdmin },
    { name: 'Panduan', href: '/guide', icon: HelpCircle, show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm transform -rotate-3 transition-transform hover:rotate-0 duration-300">
            <HardHat className="w-5 h-5 transform translate-y-[-1px] translate-x-[1px]" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{tenant?.name || 'ConstructDash'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-gray-900"></span>
            )}
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col pt-16 md:pt-0 shadow-lg md:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 items-center px-6 border-b border-gray-200 dark:border-gray-800 hidden md:flex justify-between transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm transform -rotate-3 transition-transform hover:rotate-0 duration-300">
              <HardHat className="w-5 h-5 transform translate-y-[-1px] translate-x-[1px]" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight truncate max-w-[150px]">{tenant?.name || 'ConstructDash'}</span>
          </div>
          
          <div className="relative flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-gray-900"></span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-blue-600 dark:bg-blue-500 shadow-md shadow-blue-500/20 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
          {!profile && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded border border-yellow-200 dark:border-yellow-800/50">
              Data profil sedang dimuat atau tidak ditemukan.
            </div>
          )}
          <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-colors duration-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold uppercase ring-2 ring-white dark:ring-gray-900">
              {profile?.name ? profile.name.charAt(0) : '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[140px] leading-tight">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{profile?.role || 'No Role'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>

      {/* Notifications Dropdown (Absolute Positioning depending on screen) */}
      {showNotifications && (
        <div className="fixed md:absolute z-[50] mt-16 md:mt-14 w-full md:w-80 md:left-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-b-2xl md:rounded-2xl shadow-xl overflow-hidden right-0 top-0 max-h-[80vh] flex flex-col transition-colors duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={16} /> Notifikasi
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Tandai semua dibaca</button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi.</div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {notifications.map(n => (
                  <li 
                    key={n.id} 
                    className={cn("p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer", !n.isRead ? "bg-blue-50/30 dark:bg-blue-900/20" : "opacity-80")}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn("text-sm font-medium", !n.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Overlay for mobile menus */}
      {(isMobileMenuOpen || showNotifications) && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-white/5 z-10 md:z-10"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setShowNotifications(false);
          }}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full z-0 relative transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
