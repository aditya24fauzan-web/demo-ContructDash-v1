import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db, Transaction, Payable, Project } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Plus, Trash2, Search, FileText, CheckCircle, Activity, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CurrencyInput } from '../../components/CurrencyInput';

export function FinanceExpenses() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);
  
  const [deleteId, setDeleteId] = useState<{id: string, type: 'expense' | 'payable'} | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{ payableId: string, maxAmount: number, payAmount: number, date: string } | null>(null);

  const [expenseData, setExpenseData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0, category: 'MATERIAL', paymentMethod: 'TRANSFER', status: 'PENDING'
  });
  
  const [payableData, setPayableData] = useState<Partial<Payable>>({
    dueDate: new Date().toISOString().split('T')[0],
    amount: 0, status: 'UNPAID'
  });

  useEffect(() => {
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), snap => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).filter(t => t.type === 'EXPENSE'));
    });
    const unsubPay = onSnapshot(query(collection(db, 'payables'), orderBy('dueDate', 'asc')), snap => {
      setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payable)));
    });
    const unsubProj = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
    return () => { unsubTx(); unsubPay(); unsubProj(); };
  }, []);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proj = projects.find(p => p.id === expenseData.projectId);
      const data: Omit<Transaction, 'id'> = {
        projectId: expenseData.projectId || '',
        projectName: proj?.name || '',
        type: 'EXPENSE',
        category: expenseData.category || 'OTHER',
        paymentMethod: expenseData.paymentMethod || 'TRANSFER',
        amount: Number(expenseData.amount),
        date: expenseData.date || new Date().toISOString().split('T')[0],
        description: expenseData.description || '',
        referenceNo: expenseData.referenceNo || null,
        status: expenseData.status as any || 'PENDING',
        proofUrl: expenseData.proofUrl || null,
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), data);
      setShowExpenseModal(false);
      setExpenseData({ date: new Date().toISOString().split('T')[0], amount: 0, category: 'MATERIAL', paymentMethod: 'TRANSFER', status: 'PENDING' });
    } catch (error) {
      console.error(error); alert('Gagal menyimpan pengeluaran');
    }
  };

  const handlePayableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proj = projects.find(p => p.id === payableData.projectId);
      const data: Omit<Payable, 'id'> = {
        vendorName: payableData.vendorName || '',
        projectId: payableData.projectId || '',
        projectName: proj?.name || '',
        amount: Number(payableData.amount),
        paidAmount: 0,
        dueDate: payableData.dueDate || new Date().toISOString().split('T')[0],
        status: payableData.status as any || 'UNPAID',
        description: payableData.description || '',
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'payables'), data);
      setShowPayableModal(false);
      setPayableData({ dueDate: new Date().toISOString().split('T')[0], amount: 0, status: 'UNPAID' });
    } catch (error) {
      console.error(error); alert('Gagal menyimpan data hutang vendor');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!paymentModalData) return;
    try {
      const payable = payables.find(p => p.id === paymentModalData.payableId);
      if(!payable) return;
      
      const newPaidAmount = (payable.paidAmount || 0) + paymentModalData.payAmount;
      const newStatus = newPaidAmount >= payable.amount ? 'PAID' : (payable.status === 'OVERDUE' ? 'OVERDUE' : 'UNPAID');

      await updateDoc(doc(db, 'payables', paymentModalData.payableId), {
        paidAmount: newPaidAmount,
        status: newStatus
      });

      const txData: Omit<Transaction, 'id'> = {
        projectId: payable.projectId,
        projectName: payable.projectName,
        type: 'EXPENSE',
        category: 'VENDOR',
        paymentMethod: 'TRANSFER',
        amount: paymentModalData.payAmount,
        date: paymentModalData.date,
        description: `Pembayaran hutang vendor: ${payable.vendorName} - ${payable.description}`,
        referenceNo: paymentModalData.payableId,
        status: 'COMPLETED',
        proofUrl: null,
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);
      
      setPaymentModalData(null);
    } catch (error) {
      console.error(error); alert('Gagal memproses pembayaran');
    }
  };

  const handleDelete = async () => {
    if(!deleteId) return;
    try {
      if (deleteId.type === 'expense') await deleteDoc(doc(db, 'transactions', deleteId.id));
      else await deleteDoc(doc(db, 'payables', deleteId.id));
      setDeleteId(null);
    } catch (error) {
      console.error(error); alert('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative gap-4">
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari pengeluaran/vendor..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-rose-500 outline-none" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full sm:w-auto justify-center bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition flex items-center shadow-sm">
            <Plus size={16} className="mr-2" /> Catat Keluar
          </button>
          
          {showAddMenu && (
            <div className="absolute right-4 left-4 sm:left-auto top-[110px] sm:top-16 sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-2">
              <button onClick={() => { setShowAddMenu(false); setShowExpenseModal(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3">
                <FileText size={16} className="text-gray-400" /> Pengeluaran Langsung
              </button>
              <button onClick={() => { setShowAddMenu(false); setShowPayableModal(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3">
                <Activity size={16} className="text-gray-400" /> Data Hutang Vendor
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hutang Vendor Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-900 flex items-center"><Activity size={18} className="mr-2 text-rose-500"/> Hutang Vendor & Subkon</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-3 font-semibold">Vendor & Jatuh Tempo</th>
                  <th className="p-3 font-semibold text-right">Nominal (Rp)</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {payables.map(pay => (
                  <tr key={pay.id} className="hover:bg-rose-50/30">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{pay.vendorName}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[200px]">{pay.projectName || pay.description}</div>
                      <div className="text-rose-600 text-[11px] font-medium mt-1">Tempo: {format(parseISO(pay.dueDate), 'dd MMM yyyy')}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-gray-900 font-mono">{formatRupiah(pay.amount)}</div>
                      <div className="text-xs text-gray-500">Sisa: {formatRupiah(pay.amount - pay.paidAmount)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                        pay.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                        pay.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      )}>{pay.status}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {pay.status !== 'PAID' && (
                          <button onClick={() => setPaymentModalData({payableId: pay.id!, maxAmount: pay.amount - (pay.paidAmount || 0), payAmount: pay.amount - (pay.paidAmount || 0), date: new Date().toISOString().split('T')[0]})} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded" title="Bayar Hutang">
                            <CreditCard size={14} />
                          </button>
                        )}
                        <button onClick={() => setDeleteId({id: pay.id!, type: 'payable'})} className="p-1.5 text-gray-400 hover:text-rose-600 rounded" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payables.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-gray-400">Tidak ada data hutang vendor.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengeluaran Proyek Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-900 flex items-center"><FileText size={18} className="mr-2 text-indigo-500"/> Transaksi Pengeluaran Berjalan</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-3 font-semibold">Tgl & Deskripsi</th>
                  <th className="p-3 font-semibold">Kategori</th>
                  <th className="p-3 font-semibold text-right">Total (Rp)</th>
                  <th className="p-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="text-gray-500 text-xs">{format(parseISO(exp.date), 'dd MMM yyyy')}</div>
                      <div className="font-medium text-gray-900 line-clamp-2 mt-0.5">{exp.description}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{exp.projectName}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200 block w-max">{exp.category}</span>
                      <span className={clsx("text-[10px] mt-1 block font-bold", exp.status === 'COMPLETED' ? "text-emerald-600" : "text-amber-600")}>
                        {exp.status === 'COMPLETED' ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-rose-600 font-mono">-{formatRupiah(exp.amount)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => setDeleteId({id: exp.id!, type: 'expense'})} className="p-1.5 text-gray-400 hover:text-rose-600 rounded">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-gray-400">Tidak ada data pengeluaran.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal forms basically same as FinanceOld but adjusted somewhat, simplified here for space */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Catat Pengeluaran Proyek</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
              <form onSubmit={handleExpenseSubmit} className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" required value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
                    <select required value={expenseData.projectId} onChange={e => setExpenseData({...expenseData, projectId: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                      <option value="">Umum / Non-Proyek</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select required value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                      <option value="MATERIAL">Material & Bahan</option>
                      <option value="LABOR">Upah Pekerja</option>
                      <option value="OPERATIONAL">Operasional Alat & Transport</option>
                      <option value="VENDOR">Subkontraktor / Vendor</option>
                      <option value="TAX">Pajak & Legal</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Approval</label>
                    <select value={expenseData.status} onChange={e => setExpenseData({...expenseData, status: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                      <option value="PENDING">Pending Approval</option>
                      <option value="COMPLETED">Approved / Lunas</option>
                    </select>
                 </div>
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Pengeluaran</label>
                    <input required value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Beli semen 100 sak..." />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Keluar (Rp)</label>
                    <CurrencyInput required value={expenseData.amount || 0} onChange={val => setExpenseData({...expenseData, amount: val})} className="w-full border p-2 rounded-lg text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Nota (URL)</label>
                    <input type="url" value={expenseData.proofUrl || ''} onChange={e => setExpenseData({...expenseData, proofUrl: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Link struk..." />
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 shadow-sm">Simpan</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {showPayableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Catat Hutang Vendor</h2>
              <button onClick={() => setShowPayableModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handlePayableSubmit} className="p-6">
               <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Vendor / Supplier</label>
                    <input required value={payableData.vendorName} onChange={e => setPayableData({...payableData, vendorName: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Toko Bangunan Jaya" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proyek Terkait</label>
                    <select required value={payableData.projectId} onChange={e => setPayableData({...payableData, projectId: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                      <option value="">Pilih Proyek...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Hutang (Rp)</label>
                    <CurrencyInput required value={payableData.amount || 0} onChange={val => setPayableData({...payableData, amount: val})} className="w-full border p-2 rounded-lg text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                    <input type="date" required value={payableData.dueDate} onChange={e => setPayableData({...payableData, dueDate: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <input value={payableData.description || ''} onChange={e => setPayableData({...payableData, description: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Sewa alat berat beko 3 hari..." />
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPayableModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">Simpan Hutang</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Bayar Hutang</h2>
              <button onClick={() => setPaymentModalData(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6">
               <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Belum Dibayar (Rp)</label>
                    <div className="w-full border p-2 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono">
                      {formatRupiah(paymentModalData.maxAmount)}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar</label>
                    <input type="date" required value={paymentModalData.date} onChange={e => setPaymentModalData({...paymentModalData, date: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Dibayar (Rp)</label>
                    <CurrencyInput
                      required 
                      max={paymentModalData.maxAmount}
                      value={paymentModalData.payAmount || 0} 
                      onChange={val => setPaymentModalData({...paymentModalData, payAmount: val})} 
                      className="w-full border p-2 rounded-lg text-sm" 
                    />
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setPaymentModalData(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm flex items-center">
                  <CreditCard size={16} className="mr-2" /> Konfirmasi Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Hapus Data`}
        message={`Yakin ingin menghapus data ini? Aksi tidak dapat dibatalkan.`}
      />
    </div>
  );
}
