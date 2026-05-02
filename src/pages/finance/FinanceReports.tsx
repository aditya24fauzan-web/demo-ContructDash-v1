import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, Transaction, Project } from '../../lib/db';
import { Download, Filter, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function FinanceReports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [selectedReport, setSelectedReport] = useState<'laba-rugi' | 'cashflow' | 'pengeluaran'>('laba-rugi');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  useEffect(() => {
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).filter(t => t.status === 'COMPLETED'));
    });
    const unsubProj = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
    return () => { unsubTx(); unsubProj(); };
  }, []);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const filteredTx = selectedProjectId === 'all' 
    ? transactions 
    : transactions.filter(t => t.projectId === selectedProjectId || t.projectId === projects.find(p => p.id === selectedProjectId)?.customId);

  // Income
  const incomeProj = filteredTx.filter(t => t.type === 'INCOME' && ['PAYMENT_RECEIVED', 'DOWN_PAYMENT'].includes(t.category)).reduce((a, t) => a + t.amount, 0);
  const incomeOther = filteredTx.filter(t => t.type === 'INCOME' && !['PAYMENT_RECEIVED', 'DOWN_PAYMENT'].includes(t.category)).reduce((a, t) => a + t.amount, 0);
  const totalIncome = incomeProj + incomeOther;

  // Expenses
  const expMaterial = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'MATERIAL').reduce((a, t) => a + t.amount, 0);
  const expLabor = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'LABOR').reduce((a, t) => a + t.amount, 0);
  const expVendor = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'VENDOR').reduce((a, t) => a + t.amount, 0);
  const expOps = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'OPERATIONAL').reduce((a, t) => a + t.amount, 0);
  const expTax = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'TAX').reduce((a, t) => a + t.amount, 0);
  const expOther = filteredTx.filter(t => t.type === 'EXPENSE' && t.category === 'OTHER').reduce((a, t) => a + t.amount, 0);
  const totalExpense = expMaterial + expLabor + expVendor + expOps + expTax + expOther;
  
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 self-start sm:self-auto w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <button onClick={() => setSelectedReport('laba-rugi')} className={clsx("flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition", selectedReport === 'laba-rugi' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900")}>Laba Rugi</button>
          <button onClick={() => setSelectedReport('cashflow')} className={clsx("flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition", selectedReport === 'cashflow' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:text-gray-900")}>Buku Kas</button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center w-full md:w-auto">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Proyek:</label>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48"
          >
            <option value="all">Satu Perusahaan (Konsolidasi)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center shadow-sm w-full sm:w-auto">
            <Download size={16} className="mr-2" /> Export
          </button>
        </div>
      </div>

      {selectedReport === 'laba-rugi' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-8 text-center border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">LAPORAN LABA RUGI KOMPREHENSIF</h2>
            <p className="text-gray-500 mt-1">{selectedProjectId === 'all' ? 'Konsolidasi Perusahaan' : `Proyek: ${projects.find(p => p.id === selectedProjectId)?.name}`}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono min-w-[600px]">
              <tbody>
                {/* PENDAPATAN */}
                <tr className="bg-gray-50 border-b border-gray-100">
                <td colSpan={2} className="px-8 py-4 font-bold text-gray-800 font-sans tracking-wide">1. PENDAPATAN USAHA</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Pendapatan Termin & Proyek</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(incomeProj)}</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Pendapatan Lainnya / Bunga</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(incomeOther)}</td>
              </tr>
              <tr className="bg-emerald-50/30">
                <td className="px-8 py-4 font-bold text-emerald-800 font-sans">TOTAL PENDAPATAN</td>
                <td className="px-8 py-4 text-right font-bold text-emerald-700 border-t border-emerald-100 text-base">{formatRupiah(totalIncome)}</td>
              </tr>

              {/* BEBAN */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <td colSpan={2} className="px-8 py-4 font-bold text-gray-800 font-sans tracking-wide">2. BEBAN POKOK PENDAPATAN (HPP)</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Material & Bahan Baku</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expMaterial)}</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Tenaga Kerja (Upah Tukang dll)</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expLabor)}</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Subkontraktor & Vendor</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expVendor)}</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Operasional Alat & Transport</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expOps)}</td>
              </tr>
              
              <tr className="bg-gray-50 border-b border-gray-100 border-t border-gray-100">
                <td colSpan={2} className="px-8 py-4 font-bold text-gray-800 font-sans tracking-wide">3. BEBAN OPERASIONAL LAAINNYA</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Pajak & Legal</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expTax)}</td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-8 py-3 pl-12 text-sm text-gray-600 font-sans">Beban Umum Lainnya</td>
                <td className="px-8 py-3 text-right text-sm">{formatRupiah(expOther)}</td>
              </tr>
              
              <tr className="bg-rose-50/30">
                <td className="px-8 py-4 font-bold text-rose-800 font-sans">TOTAL BEBAN & PENGELUARAN</td>
                <td className="px-8 py-4 text-right font-bold text-rose-700 border-t border-rose-100 text-base">{formatRupiah(totalExpense)}</td>
              </tr>

              {/* LABA BERSIH */}
              <tr className={clsx(balance >= 0 ? "bg-indigo-50 border-t-2 border-indigo-200" : "bg-red-50 border-t-2 border-red-200")}>
                <td className="px-8 py-6 font-black text-gray-900 font-sans tracking-widest uppercase text-lg">LABA (RUGI) BERSIH</td>
                <td className={clsx("px-8 py-6 text-right font-bold text-xl", balance >= 0 ? "text-indigo-700" : "text-rose-700")}>
                  {formatRupiah(balance)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <span>Digenerate pada: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
            <span>SIMPROKA Financial System</span>
          </div>
        </div>
      )}

      {selectedReport === 'cashflow' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-semibold">Tgl / Ref</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                  <th className="p-4 font-semibold text-right text-emerald-600">Debit (Masuk)</th>
                  <th className="p-4 font-semibold text-right text-rose-600">Kredit (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredTx.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{format(parseISO(t.date), 'dd MMM yyyy')}</div>
                      <div className="text-gray-400 font-mono text-[10px] uppercase">{t.referenceNo || t.id?.substring(0,8)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{t.description}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{t.projectName || 'Umum'} • {t.category}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-emerald-600">
                      {t.type === 'INCOME' ? formatRupiah(t.amount) : '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-rose-600">
                      {t.type === 'EXPENSE' ? formatRupiah(t.amount) : '-'}
                    </td>
                  </tr>
                ))}
                {filteredTx.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Tidak ada transaksi tercatat.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
