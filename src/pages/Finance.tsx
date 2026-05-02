import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { LayoutDashboard, FileText, ArrowDownRight, ArrowUpRight, Target, Wallet, BarChart2, TrendingUp, Download, PieChart } from 'lucide-react';
import { clsx } from 'clsx';
import { FinanceOverview } from './finance/FinanceOverview';
import { FinanceInvoices } from './finance/FinanceInvoices';
import { FinanceExpenses } from './finance/FinanceExpenses';
import { FinanceBudget } from './finance/FinanceBudget';
import { FinanceCashflow } from './finance/FinanceCashflow';
import { FinanceReports } from './finance/FinanceReports';

type TabId = 'dashboard' | 'invoices' | 'expenses' | 'budget' | 'cashflow' | 'reports';

export function Finance() {
  const { profile } = useAuth();
  const role = String(profile?.role || '').toLowerCase().trim();
  const isAdmin = role === 'admin';
  const isPM = role === 'manager';
  const isPC = role === 'pc';

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (isPC) {
    return (
      <div className="p-8 pb-32 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-100 flex items-center">
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoice & Piutang', icon: FileText },
    { id: 'expenses', label: 'Pengeluaran & Hutang', icon: ArrowUpRight },
    { id: 'budget', label: 'Budget/RAB', icon: Target },
    { id: 'cashflow', label: 'Cashflow & Profit', icon: TrendingUp },
    { id: 'reports', label: 'Laporan Keuangan', icon: PieChart }
  ];

  return (
    <div className="p-4 md:p-8 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation for Finance */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-4 md:sticky md:top-6">
          <div className="mb-4 md:mb-6 px-2">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Manajemen Keuangan</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Sistem kontrol finansial</p>
          </div>
          
          <nav className="flex overflow-x-auto gap-2 md:block md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={clsx(
                    "flex-shrink-0 w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    activeTab === tab.id 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                  )}
                >
                  <Icon size={18} className={clsx(activeTab === tab.id ? "text-indigo-600" : "text-gray-400", "hidden md:block")} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'dashboard' && <FinanceOverview />}
          {activeTab === 'invoices' && <FinanceInvoices />}
          {activeTab === 'expenses' && <FinanceExpenses />}
          {activeTab === 'budget' && <FinanceBudget />}
          {activeTab === 'cashflow' && <FinanceCashflow />}
          {activeTab === 'reports' && <FinanceReports />}
        </div>
      </div>
    </div>
  );
}
