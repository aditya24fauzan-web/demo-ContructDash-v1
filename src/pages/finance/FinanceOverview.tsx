import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, Transaction, Invoice, Payable, Project, Budget } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

export function FinanceOverview() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    if (!profile?.tenantId) return;
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), where('tenantId', '==', profile.tenantId), orderBy('date', 'desc')), snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsubInv = onSnapshot(query(collection(db, 'invoices'), where('tenantId', '==', profile.tenantId), orderBy('date', 'desc')), snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    });
    const unsubPay = onSnapshot(query(collection(db, 'payables'), where('tenantId', '==', profile.tenantId), orderBy('dueDate', 'asc')), snap => {
      setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payable)));
    });
    const unsubProj = onSnapshot(query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    });
    const unsubBudg = onSnapshot(query(collection(db, 'budgets'), where('tenantId', '==', profile.tenantId)), snap => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget)));
    });
    return () => { unsubTx(); unsubInv(); unsubPay(); unsubProj(); unsubBudg(); };
  }, [profile?.tenantId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat dashboard keuangan...</div>;
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(number);
  };

  const today = new Date();
  const startDayOfMonth = startOfMonth(today);
  const endDayOfMonth = endOfMonth(today);

  // Month filtering
  const thisMonthTx = transactions.filter(t => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: startDayOfMonth, end: endDayOfMonth });
  });

  const totalIncomeMonth = thisMonthTx.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseMonth = thisMonthTx.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
  const profitMonth = totalIncomeMonth - totalExpenseMonth;

  const totalIncomeAll = transactions.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseAll = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
  const cashAvailable = totalIncomeAll - totalExpenseAll;

  // AR and AP
  const totalAR = invoices.filter(i => i.status !== 'PAID' && i.status !== 'DRAFT').reduce((acc, i) => acc + (i.amount - (i.paidAmount || 0)), 0);
  const totalAP = payables.filter(p => p.status !== 'PAID').reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);
  
  // Alerts logic
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE' || (parseISO(i.dueDate) < today && i.status !== 'PAID'));
  const pendingExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING');
  
  const budgetAlerts = projects.map(p => {
    const pBudgets = budgets.filter(b => b.projectId === p.id);
    const pExps = transactions.filter(t => t.projectId === p.id && t.type === 'EXPENSE');
    const bTotal = pBudgets.reduce((a,b)=>a+b.plannedAmount, 0);
    const eTotal = pExps.reduce((a,t)=>a+t.amount, 0);
    if(bTotal > 0 && eTotal > bTotal * 0.9) return { p, bTotal, eTotal };
    return null;
  }).filter(Boolean);

  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayTx = transactions.filter(t => t.date === dateStr && t.status === 'COMPLETED');
    const inc = dayTx.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    const exp = dayTx.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    chartData.push({
      date: format(d, 'dd MMM', { locale: id }),
      rawDate: dateStr,
      Income: inc,
      Expense: exp
    });
  }

  // Top Projects Profitability
  const projectProfits = projects.map(p => {
    const pTx = transactions.filter(t => (t.projectId === p.id || t.projectId === p.customId) && t.status === 'COMPLETED');
    const inc = pTx.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    const exp = pTx.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    return { name: p.name, profit: inc - exp, inc, exp };
  }).sort((a, b) => b.profit - a.profit).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Cash Tersedia" 
          amount={cashAvailable} 
          icon={<DollarSign size={20} className="text-white" />} 
          color="bg-emerald-500" 
          subtitle="Saldo riil perusahaan" 
        />
        <SummaryCard 
          title="Profit Netto (Bulan Ini)" 
          amount={profitMonth} 
          icon={<TrendingUp size={20} className="text-white" />} 
          color={profitMonth >= 0 ? "bg-indigo-600" : "bg-rose-500"} 
          subtitle={`In: ${formatRupiah(totalIncomeMonth)} | Out: ${formatRupiah(totalExpenseMonth)}`} 
        />
        <SummaryCard 
          title="Total Piutang Client" 
          amount={totalAR} 
          icon={<FileText size={20} className="text-white" />} 
          color="bg-amber-500" 
          subtitle="Dari invoice belum lunas" 
        />
        <SummaryCard 
          title="Total Hutang Supplier" 
          amount={totalAP} 
          icon={<Activity size={20} className="text-white" />} 
          color="bg-rose-500" 
          subtitle="Vendor & Subkon" 
        />
      </div>

      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-red-800 text-sm">Peringatan: {overdueInvoices.length} Invoice Jatuh Tempo</h4>
            <p className="text-red-600 text-xs mt-1">Segera follow up client untuk tagihan yang telah melewati tanggal jatuh tempo dengan total nilai Rp {formatRupiah(overdueInvoices.reduce((a,b) => a + (b.amount - b.paidAmount), 0))}.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">Arus Kas (30 Hari Terakhir)</h3>
            <p className="text-sm text-gray-500">Perbandingan pemasukan dan pengeluaran harian</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={30} />
                <YAxis tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  formatter={(value: number) => [`Rp ${formatRupiah(value)}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Income" name="Pemasukan" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="Expense" name="Pengeluaran" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">Top 5 Proyek (Profit)</h3>
            <p className="text-sm text-gray-500">Berdasarkan laba kotor tertinggi</p>
          </div>
          <div className="space-y-4">
            {projectProfits.map((p, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 text-sm truncate">{p.name}</span>
                  <span className={clsx("font-bold text-sm", p.profit >= 0 ? "text-indigo-600" : "text-rose-600")}>
                    {p.profit >= 0 ? '+' : ''}{formatRupiah(p.profit)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center text-emerald-600"><TrendingUp size={12} className="mr-1"/> {formatRupiah(p.inc)}</div>
                  <div className="flex items-center text-rose-500"><TrendingDown size={12} className="mr-1"/> {formatRupiah(p.exp)}</div>
                </div>
              </div>
            ))}
            {projectProfits.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">Belum ada data profit</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon, color, subtitle }: { title: string, amount: number, icon: React.ReactNode, color: string, subtitle: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            Rp {new Intl.NumberFormat('id-ID').format(amount)}
          </h3>
        </div>
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", color)}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-400 font-medium">
        {subtitle}
      </p>
      {/* Decorative gradient */}
      <div className={clsx("absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500", color)}></div>
    </div>
  );
}
