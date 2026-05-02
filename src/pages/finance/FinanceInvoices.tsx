import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, Invoice, Project, Transaction } from '../../lib/db';
import { auth, storage } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Plus, Edit2, Trash2, Search, FileText, CheckCircle, Clock, AlertCircle, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { ConfirmModal } from '../../components/ConfirmModal';

import { CurrencyInput } from '../../components/CurrencyInput';

export function FinanceInvoices() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDirectIncomeModal, setShowDirectIncomeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNo: '',
    projectId: '',
    clientName: '',
    term: 'Termin 1',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'UNPAID',
    notes: '',
    fileUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'TRANSFER',
    proofUrl: '',
    notes: ''
  });

  useEffect(() => {
    const unsubInv = onSnapshot(query(collection(db, 'invoices'), orderBy('date', 'desc')), snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    });
    const unsubProj = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    });
    return () => { unsubInv(); unsubProj(); };
  }, []);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalFileUrl = formData.fileUrl || '';

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `invoices/${Date.now()}_${formData.invoiceNo?.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        finalFileUrl = await getDownloadURL(snapshot.ref);
      }

      const proj = projects.find(p => p.id === formData.projectId);
      const data: Invoice = {
        invoiceNo: formData.invoiceNo!,
        projectId: formData.projectId!,
        projectName: proj?.name || '',
        clientName: formData.clientName!,
        term: formData.term!,
        amount: Number(formData.amount),
        paidAmount: 0,
        date: formData.date!,
        dueDate: formData.dueDate!,
        notes: formData.notes || '',
        status: formData.status as any,
        fileUrl: finalFileUrl,
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'invoices'), data);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      alert('Gagal menyimpan invoice: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      invoiceNo: '', projectId: '', clientName: '', term: 'Termin 1', amount: 0,
      date: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0],
      status: 'UNPAID', notes: '', fileUrl: ''
    });
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus');
    }
  };

  const handleDirectIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proj = projects.find(p => p.id === paymentData.projectId);
      const txData: Omit<Transaction, 'id'> = {
        projectId: paymentData.projectId || '',
        projectName: proj?.name || 'Kas Umum / Non-Proyek',
        type: 'INCOME',
        category: 'OTHER_INCOME',
        amount: Number(paymentData.amount),
        date: paymentData.date,
        description: paymentData.notes || 'Pemasukan Langsung / Lain-lain',
        status: 'COMPLETED',
        paymentMethod: paymentData.paymentMethod,
        referenceNo: `INC-${Date.now()}`,
        proofUrl: paymentData.proofUrl || null,
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);
      setShowDirectIncomeModal(false);
      setPaymentData({ amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'TRANSFER', proofUrl: '', notes: '', projectId: '' } as any);
    } catch (error: any) {
      console.error(error);
      alert('Gagal mencatat pemasukan: ' + error.message);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoice = invoices.find(i => i.id === showPaymentModal);
      if (!invoice) return;

      const payAmount = Number(paymentData.amount);
      const newPaid = invoice.paidAmount + payAmount;
      let newStatus = invoice.status;
      if (newPaid >= invoice.amount) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIAL';

      // Update invoice
      await updateDoc(doc(db, 'invoices', invoice.id!), {
        paidAmount: newPaid,
        status: newStatus
      });

      // Create transaction
      const txData: Omit<Transaction, 'id'> = {
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        projectName: invoice.projectName,
        type: 'INCOME',
        category: 'PAYMENT_RECEIVED',
        amount: payAmount,
        date: paymentData.date,
        description: `Pembayaran ${invoice.term} - ${invoice.invoiceNo} ${paymentData.notes ? `(${paymentData.notes})` : ''}`,
        status: 'COMPLETED',
        paymentMethod: paymentData.paymentMethod,
        referenceNo: invoice.invoiceNo,
        proofUrl: paymentData.proofUrl || null,
        createdBy: profile?.uid || 'unknown',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), txData);

      setShowPaymentModal(null);
      setPaymentData({ amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'TRANSFER', proofUrl: '', notes: '' });
    } catch (error) {
      console.error(error);
      alert('Gagal mencatat pembayaran');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-4 relative">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari invoice..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full sm:w-auto justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center shadow-sm">
            <Plus size={16} className="mr-2" /> Catat Masuk
          </button>
          
          {showAddMenu && (
            <div className="absolute right-4 left-4 sm:left-auto top-[110px] sm:top-16 sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-2">
              <button onClick={() => { setShowAddMenu(false); setShowDirectIncomeModal(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3">
                <FileText size={16} className="text-gray-400" /> Pemasukan Langsung / Tunai
              </button>
              <button onClick={() => { setShowAddMenu(false); setShowAddModal(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50 mt-1 pt-3">
                <Clock size={16} className="text-gray-400" /> Buat Invoice Baru / Termin
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">No. Invoice & Client</th>
                <th className="p-4 font-semibold">Proyek & Termin</th>
                <th className="p-4 font-semibold">Tgl / Jatuh Tempo</th>
                <th className="p-4 font-semibold text-right">Total Owt. (Rp)</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 mb-0.5">{inv.invoiceNo}</div>
                    <div className="text-gray-500 text-xs">{inv.clientName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800 line-clamp-1">{inv.projectName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{inv.term}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-700 text-xs mb-1">Tgl: {format(parseISO(inv.date), 'dd MMM yyyy')}</div>
                    <div className="text-rose-600 text-xs font-medium bg-rose-50 inline-block px-1.5 py-0.5 rounded border border-rose-100">
                      Tempo: {format(parseISO(inv.dueDate), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-gray-900 font-mono">Rp {formatRupiah(inv.amount)}</div>
                    <div className="text-xs text-gray-500 mt-1">Sisa: Rp {formatRupiah(inv.amount - inv.paidAmount)}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm border",
                      inv.status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      inv.status === 'PARTIAL' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      inv.status === 'OVERDUE' ? "bg-rose-50 text-rose-700 border-rose-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {inv.status !== 'PAID' && (
                        <button onClick={() => { setShowPaymentModal(inv.id!); setPaymentData({...paymentData, amount: inv.amount - inv.paidAmount}); }} className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-semibold hover:bg-indigo-100 transition">
                          Terima Bayar
                        </button>
                      )}
                      {inv.fileUrl && (
                        <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Lihat Dokumen">
                          <FileText size={16} />
                        </a>
                      )}
                      <button onClick={() => setDeleteConfirmId(inv.id!)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center p-8 text-gray-500">Tidak ada data invoice.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Buat Invoice Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                 ✕ 
              </button>
            </div>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Invoice</label>
                  <input required value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="INV/2026/01/01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyek Terkait</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                    <option value="">Pilih Proyek...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client / Instansi</label>
                  <input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="PT. Jaya Abadi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Termin / Jenis Tagihan</label>
                  <input required value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Contoh: DP 30% atau Termin 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                  <CurrencyInput required value={formData.amount || 0} onChange={val => setFormData({...formData, amount: val})} className="w-full border p-2 rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Awal</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent (Dikirim)</option>
                    <option value="UNPAID">Belum Dibayar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tgl Invoice</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                  <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">File Invoice (PDF/Image)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition cursor-pointer relative bg-gray-50">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none px-2 py-0.5">
                        <span>Pilih file</span>
                        <input type="file" className="sr-only" accept=".pdf,image/*" onChange={e => {
                          if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                        }} />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG maksimal 10MB</p>
                    {selectedFile && (
                      <div className="text-sm font-medium text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded inline-block">
                        Terpilih: {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>
                {!selectedFile && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Atau masukkan Link / URL</label>
                    <input type="url" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Link GDrive..." />
                  </div>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full border p-2 rounded-lg text-sm" placeholder="Catatan tambahan..."></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium" disabled={uploading}>Batal</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? 'Menyimpan...' : 'Simpan Invoice'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Catat Pembayaran Masuk</h2>
              <button onClick={() => setShowPaymentModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handlePayment} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Diterima (Rp)</label>
                  <CurrencyInput required value={paymentData.amount || 0} onChange={val => setPaymentData({...paymentData, amount: val})} className="w-full border p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar</label>
                  <input type="date" required value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metode</label>
                  <select value={paymentData.paymentMethod} onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai</option>
                    <option value="GIRO">Cek / BG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Transfer (URL)</label>
                  <input type="url" value={paymentData.proofUrl} onChange={e => setPaymentData({...paymentData, proofUrl: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Link bukti transfer..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <input type="text" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Bank Mandiri a/n..." />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowPaymentModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan Pembayaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDirectIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Catat Pemasukan Langsung</h2>
              <button onClick={() => setShowDirectIncomeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleDirectIncome} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input type="date" required value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} className="w-full border p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyek Terkait (Opsional)</label>
                  <select value={(paymentData as any).projectId || ''} onChange={e => setPaymentData({...paymentData, projectId: e.target.value} as any)} className="w-full border p-2 rounded-lg text-sm">
                    <option value="">-- Non Spesifik / Kas Umum --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                  <CurrencyInput required value={paymentData.amount || 0} onChange={val => setPaymentData({...paymentData, amount: val})} className="w-full border p-2 rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pemasukan</label>
                  <input type="text" required value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Pendapatan jual barang bekas..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metode</label>
                    <select value={paymentData.paymentMethod} onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})} className="w-full border p-2 rounded-lg text-sm">
                      <option value="TRANSFER">Transfer</option>
                      <option value="CASH">Tunai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bukti (URL)</label>
                    <input type="url" value={paymentData.proofUrl} onChange={e => setPaymentData({...paymentData, proofUrl: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="Link bukti..." />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowDirectIncomeModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">Simpan Pemasukan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Hapus Invoice"
        message="Yakin ingin menghapus dokumen invoice ini? Ini tidak akan menghapus transaksi pembayaran yang sudah tercatat."
      />
    </div>
  );
}
