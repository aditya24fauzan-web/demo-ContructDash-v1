import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, Project, Report, Activity, Transaction } from '../lib/db';
import { ArrowLeft, MapPin, Calendar, Clock, Target, AlertTriangle, FileText, Wallet, CheckCircle, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'laporan' | 'keuangan'>('laporan');
  
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<(Report & { activities: Activity[] })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Fetch Project
        const projectSnap = await getDoc(doc(db, 'projects', id));
        if (projectSnap.exists()) {
          setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
        }

        // Fetch Reports
        const reportsQuery = query(collection(db, 'reports'), where('projectId', '==', id), orderBy('date', 'desc'));
        const reportsSnap = await getDocs(reportsQuery);
        const fetchedReports = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));

        // Fetch Activities
        const activitiesQuery = query(collection(db, 'activities'), where('projectId', '==', id), orderBy('dayNumber', 'asc'));
        const activitiesSnap = await getDocs(activitiesQuery);
        const allActivities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));

        const reportsWithActivities = fetchedReports.map(report => ({
          ...report,
          activities: allActivities.filter(a => a.reportId === report.id)
        }));
        setReports(reportsWithActivities);

        // Fetch Transactions specifically for this project
        const txQuery = query(collection(db, 'transactions'), where('projectId', '==', id), orderBy('date', 'desc'));
        const txSnap = await getDocs(txQuery);
        const fetchedTx = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(fetchedTx);

      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const projectExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);
  const projectIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Project tidak ditemukan</h2>
        <Link to="/projects" className="text-indigo-600 hover:underline mt-4 inline-block">Kembali ke Project</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link to="/projects" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Project
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center text-gray-500 gap-4">
              <span className="flex items-center gap-1"><MapPin size={16} /> {project.location}</span>
              <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", 
                project.status === 'active' ? 'bg-indigo-100 text-indigo-800' :
                project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                'bg-rose-100 text-rose-800'
              )}>
                {project.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 min-w-[200px] border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 font-medium">Progress Fisik</span>
              <span className="font-bold text-indigo-600">{project.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Mulai</p>
              <p className="font-medium text-sm">{format(parseISO(project.startDate), 'dd MMM yyyy', { locale: localeId })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Target size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Deadline</p>
              <p className="font-medium text-sm">{format(parseISO(project.deadline), 'dd MMM yyyy', { locale: localeId })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Estimasi</p>
              <p className="font-medium text-sm">{project.estimatedDays} Hari</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hari ke</p>
              <p className="font-medium text-sm">{project.currentDay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('laporan')}
          className={clsx(
            "py-3 px-6 font-medium text-sm border-b-2 transition-colors duration-200 flex items-center gap-2",
            activeTab === 'laporan' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          <FileText size={18} /> Laporan Harian
        </button>
        <button
          onClick={() => setActiveTab('keuangan')}
          className={clsx(
            "py-3 px-6 font-medium text-sm border-b-2 transition-colors duration-200 flex items-center gap-2",
            activeTab === 'keuangan' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          <Wallet size={18} /> Keuangan Project
        </button>
      </div>

      {activeTab === 'laporan' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center text-gray-500">
              Belum ada laporan untuk project ini.
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="border-b border-gray-100 bg-gray-50 p-4 flex justify-between items-center">
                    <div className="font-medium text-gray-900">
                      {format(parseISO(report.date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={clsx("px-2 py-1 rounded text-xs font-medium", 
                        report.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        report.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      )}>
                        {report.status === 'approved' ? 'Disetujui' : report.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wider">Aktivitas Hari Ini</h4>
                        {report.activities.length > 0 ? (
                          <ul className="space-y-3">
                            {report.activities.map((act, i) => (
                              <li key={act.id || i} className="flex gap-3 text-sm">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                  {act.dayNumber}
                                </span>
                                <span className="text-gray-700 pt-0.5">{act.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Tidak ada aktivitas tersimpan.</p>
                        )}
                      </div>

                      {report.workerCount !== undefined && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 uppercase mb-2 tracking-wider">Jumlah Pekerja</h4>
                          <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-sm font-medium inline-block pr-6">
                            👨‍🔧 {report.workerCount} Orang
                          </div>
                        </div>
                      )}

                      {report.issues && (
                        <div>
                          <h4 className="text-sm font-bold text-rose-700 uppercase mb-2 tracking-wider">Kendala / Isu</h4>
                          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-lg text-sm whitespace-pre-wrap">
                            {report.issues}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wider">Dokumentasi</h4>
                      {report.photoUrl ? (
                        <a href={report.photoUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={report.photoUrl} 
                            alt={`Dokumentasi ${report.date}`} 
                            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : (
                        <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-gray-200 border-dashed">
                          Tidak ada foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Pemasukan (Termin)</p>
                  <h3 className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">
                    {formatRupiah(projectIncome)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowUpRight size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Biaya & Pengeluaran Aktual</p>
                  <h3 className="text-2xl font-bold text-rose-700 font-mono tracking-tight">
                    {formatRupiah(projectExpense)}
                  </h3>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Riwayat Transaksi Project</h3>
              <Link to="/finance" className="text-sm text-indigo-600 font-medium hover:underline">Kelola di Keuangan</Link>
            </div>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <th className="p-4 font-medium">No. Ref & Tgl</th>
                      <th className="p-4 font-medium">Keterangan</th>
                      <th className="p-4 font-medium">Kategori & Metode</th>
                      <th className="p-4 font-medium text-right">Nilai (Rp)</th>
                      <th className="p-4 font-medium text-center">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 border-b border-gray-200 border-dashed pb-0.5 mb-1 inline-block text-xs">{t.referenceNo || 'Tanpa Referensi'}</div>
                          <div className="text-gray-500 text-xs flex items-center"><Calendar size={12} className="mr-1"/> {format(parseISO(t.date), 'dd MMM yyyy')}</div>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{t.description}</td>
                        <td className="p-4 text-gray-600">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200 font-medium">
                              {t.category}
                            </span>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold border border-gray-100 px-1.5 rounded-sm">
                              {t.paymentMethod || 'TRANSFER'}
                            </span>
                          </div>
                        </td>
                        <td className={clsx("p-4 whitespace-nowrap text-right font-mono font-bold", t.type === 'INCOME' ? "text-emerald-600" : "text-rose-600")}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                        </td>
                        <td className="p-4 text-center">
                          {t.proofUrl ? (
                            <a href={t.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs transition-colors" title="Lihat Bukti">
                              <FileText size={16} />
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Belum ada transaksi tercatat untuk project ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
