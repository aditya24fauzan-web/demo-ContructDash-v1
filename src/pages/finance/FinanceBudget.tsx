import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db, Budget, Transaction, Project } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Target, Search, Plus, Trash2, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CurrencyInput } from '../../components/CurrencyInput';

export function FinanceBudget() {
  const { profile } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectId: '', category: 'MATERIAL', plannedAmount: 0
  });

  useEffect(() => {
    if (!profile?.tenantId) return;
    const unsubB = onSnapshot(query(collection(db, 'budgets'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc')), snap => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget))));
    const unsubT = onSnapshot(query(collection(db, 'transactions'), where('tenantId', '==', profile.tenantId)), snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED')));
    const unsubP = onSnapshot(query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc')), snap => {
      const projs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(projs);
      if(projs.length > 0 && !selectedProjectId) setSelectedProjectId(projs[0].id!);
    });
    return () => { unsubB(); unsubT(); unsubP(); };
  }, [profile?.tenantId]);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proj = projects.find(p => p.id === formData.projectId);
      if (editId) {
        await updateDoc(doc(db, 'budgets', editId), {
          projectId: formData.projectId,
          projectName: proj?.name || '',
          category: formData.category,
          plannedAmount: Number(formData.plannedAmount)
        });
      } else {
        const data: Omit<Budget, 'id'> = {
          projectId: formData.projectId,
          projectName: proj?.name || '',
          category: formData.category,
          plannedAmount: Number(formData.plannedAmount),
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'budgets'), { ...data, tenantId: profile?.tenantId || '' });
      }
      setShowAddModal(false);
      setEditId(null);
      setFormData({ ...formData, plannedAmount: 0 });
    } catch (error) {
      console.error(error); alert('Gagal menyimpan budget');
    }
  };

  const projectBudgets = budgets.filter(b => b.projectId === selectedProjectId);
  const projectExpenses = transactions.filter(t => t.projectId === selectedProjectId);

  const budgetSummary = projectBudgets.map(b => {
    const spent = projectExpenses.filter(e => e.category === b.category).reduce((acc, e) => acc + e.amount, 0);
    const remaining = b.plannedAmount - spent;
    const percent = Math.min((spent / b.plannedAmount) * 100, 100);
    return { ...b, spent, remaining, percent };
  });

  const totalBudget = projectBudgets.reduce((acc, b) => acc + b.plannedAmount, 0);
  const totalSpent = projectExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center w-full md:w-auto">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Pilih Proyek:</label>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium w-full sm:w-64"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ projectId: selectedProjectId, category: 'MATERIAL', plannedAmount: 0 }); setShowAddModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center shadow-sm w-full md:w-auto">
          <Plus size={16} className="mr-2" /> Set RAB Kategori
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Target size={150} />
        </div>
        
        <h3 className="font-bold text-gray-900 mb-6 text-lg">Ringkasan RAB / Budget Proyek</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Total Anggaran (RAB)</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">Rp {formatRupiah(totalBudget)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Realisasi Pengeluaran</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">Rp {formatRupiah(totalSpent)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1 font-medium">Sisa Budget</p>
            <p className={clsx("text-2xl font-bold tracking-tight", (totalBudget - totalSpent) < 0 ? "text-rose-600" : "text-emerald-600")}>
              Rp {formatRupiah(totalBudget - totalSpent)}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-gray-700">Progress Penyerapan Budget</span>
            <span className={clsx(totalPercent > 100 ? "text-rose-600" : "text-gray-900")}>
              {totalPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={clsx("h-3 rounded-full transition-all duration-1000", totalPercent > 100 ? "bg-rose-500" : totalPercent > 80 ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        <h4 className="font-semibold text-gray-800 mb-4">Rincian Budget per Kategori</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetSummary.map(b => (
            <div key={b.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100">
                    {b.category}
                  </span>
                  {b.percent >= 100 && <AlertTriangle size={14} className="text-rose-500" />}
                </div>
                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(b.id!); setFormData({ projectId: b.projectId, category: b.category, plannedAmount: b.plannedAmount }); setShowAddModal(true); }} className="text-gray-300 hover:text-indigo-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(b.id!)} className="text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-500 text-xs">Anggaran</p>
                  <p className="font-semibold text-gray-900">Rp {formatRupiah(b.plannedAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Realisasi</p>
                  <p className="font-semibold text-gray-900">Rp {formatRupiah(b.spent)}</p>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div 
                  className={clsx("h-2 rounded-full", b.percent > 100 ? "bg-rose-500" : b.percent > 85 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>{b.percent.toFixed(1)}% Terpakai</span>
                <span className={b.remaining < 0 ? "text-rose-600" : ""}>Sisa: Rp {formatRupiah(b.remaining)}</span>
              </div>
            </div>
          ))}
          {budgetSummary.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Belum ada RAC/Budget yang diatur untuk proyek ini.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Anggaran / RAB' : 'Atur Anggaran / RAB'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyek Target</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50" disabled={!!editId}>
                    <option value="">Pilih Proyek...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Biaya</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded-lg text-sm" disabled={!!editId}>
                    <option value="MATERIAL">Material & Bahan Baku</option>
                    <option value="LABOR">Upah Pengerja</option>
                    <option value="OPERATIONAL">Operasi, Alat, & Transport</option>
                    <option value="VENDOR">Subkontraktor / Vendor</option>
                    <option value="TAX">Legal & Pajak</option>
                    <option value="OTHER">Lain - lain</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Anggaran (Rp)</label>
                  <CurrencyInput required value={formData.plannedAmount || 0} onChange={val => setFormData({...formData, plannedAmount: val})} className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">Simpan RAB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteDoc(doc(db, 'budgets', deleteConfirmId));
            setDeleteConfirmId(null);
          }
        }}
        title="Hapus Budget"
        message="Yakin ingin menghapus item RAB ini?"
      />
    </div>
  );
}
