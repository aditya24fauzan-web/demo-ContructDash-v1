import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, Transaction, Project } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

export function FinanceCashflow() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewState, setViewState] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    if (!profile?.tenantId) return;
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), where('tenantId', '==', profile.tenantId), orderBy('date', 'desc')), snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).filter(t => t.status === 'COMPLETED'));
    });
    const unsubProj = onSnapshot(query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
    return () => { unsubTx(); unsubProj(); };
  }, [profile?.tenantId]);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num);
  const today = new Date();

  // Create Chart Data based on view state
  const chartData = [];
  const days = viewState === 'weekly' ? 7 : 30;
  let totalIn = 0;
  let totalOut = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayTx = transactions.filter(t => t.date === dateStr);
    const inc = dayTx.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    const exp = dayTx.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    chartData.push({
      date: format(d, 'dd MMM', { locale: id }),
      Masuk: inc,
      Keluar: exp,
      Net: inc - exp
    });
    totalIn += inc;
    totalOut += exp;
  }

  // Profit by Project Table
  const projectProfits = projects.map(p => {
    const pTx = transactions.filter(t => t.projectId === p.id || t.projectId === p.customId);
    const inc = pTx.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    const exp = pTx.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    const profit = inc - exp;
    const margin = inc > 0 ? (profit / inc) * 100 : 0;
    return { id: p.id, name: p.name, inc, exp, profit, margin };
  }).sort((a, b) => b.profit - a.profit);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Trend Cashflow</h3>
            <p className="text-sm text-gray-500">Pergerakan arus kas harian</p>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
            <button onClick={() => setViewState('weekly')} className={clsx("px-4 py-1.5 text-xs font-medium rounded-md transition", viewState === 'weekly' ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900")}>Mingguan</button>
            <button onClick={() => setViewState('monthly')} className={clsx("px-4 py-1.5 text-xs font-medium rounded-md transition", viewState === 'monthly' ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900")}>Bulanan</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Uang Masuk</p>
              <p className="text-emerald-900 text-xl font-bold tracking-tight">Rp {formatRupiah(totalIn)}</p>
            </div>
            <TrendingUp size={24} className="text-emerald-400" />
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">Uang Keluar</p>
              <p className="text-rose-900 text-xl font-bold tracking-tight">Rp {formatRupiah(totalOut)}</p>
            </div>
            <TrendingDown size={24} className="text-rose-400" />
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">Net Cashflow</p>
              <p className="text-indigo-900 text-xl font-bold tracking-tight">Rp {formatRupiah(totalIn - totalOut)}</p>
            </div>
            <RefreshCcw size={24} className="text-indigo-400" />
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(value: number) => [`Rp ${formatRupiah(value)}`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f3f4f6'}} />
              <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              <Bar dataKey="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-lg">Analisis Profitabilitas Proyek</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold w-1/3">Nama Proyek</th>
                <th className="p-4 font-semibold text-right">Pendapatan</th>
                <th className="p-4 font-semibold text-right">Biaya/HPP</th>
                <th className="p-4 font-semibold text-right">Gross Profit</th>
                <th className="p-4 font-semibold text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {projectProfits.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-900">{p.name}</td>
                  <td className="p-4 text-right font-mono text-emerald-600">{formatRupiah(p.inc)}</td>
                  <td className="p-4 text-right font-mono text-rose-500">{formatRupiah(p.exp)}</td>
                  <td className="p-4 text-right">
                    <span className={clsx("font-mono font-bold px-2 py-1 rounded bg-gray-50", p.profit >= 0 ? "text-indigo-600" : "text-rose-600")}>
                      {formatRupiah(p.profit)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
                      p.margin > 20 ? "bg-emerald-100 text-emerald-700" : 
                      p.margin > 0 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {projectProfits.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-gray-400">Tidak ada data proyek aktif.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
