import React from 'react';
import { ArrowLeft, Package, Shield, FileText, Cookie } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  const location = useLocation();

  const links = [
    { path: '/terms', label: 'Ketentuan Layanan', icon: FileText },
    { path: '/privacy', label: 'Kebijakan Privasi', icon: Shield },
    { path: '/cookies', label: 'Kebijakan Cookie', icon: Cookie },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Package className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">SIPO</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 order-2 md:order-1">
            <div className="sticky top-24">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mx-3 mb-4">Legal & Privasi</h3>
              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const isActive = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-gray-800'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200 border border-transparent'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl order-1 md:order-2">
            <div className="mb-10 lg:mb-14">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white leading-tight">
                {title}
              </h1>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400">
                Terakhir diperbarui: {lastUpdated}
              </p>
            </div>
            
            <div className="space-y-8 pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-10 bg-white dark:bg-gray-950 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} SIPO SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
