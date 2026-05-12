import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, orderBy, getDocs, getDoc, where, deleteDoc } from 'firebase/firestore';
import { db, Project, Report, Activity, uploadImage } from '../lib/db';
import { useAuth } from '../lib/auth';
import { Plus, X, Check, XCircle, Download, Image as ImageIcon, FileSpreadsheet, Eye, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV as exportDataToCSV } from '../lib/export';
import { logActivity } from '../lib/audit';
import { sendNotification } from '../lib/notification';
import { useTenant } from '../lib/tenant';

export function Reports() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const [reports, setReports] = useState<(Report & { project?: Project })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  // Form State
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [workerCount, setWorkerCount] = useState<number>(0);
  const [issues, setIssues] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [activities, setActivities] = useState([{ dayNumber: 1, description: '' }]);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId)), 
      (snapshot) => {
        setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      },
      (error) => console.error("Error fetching projects:", error)
    );

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      },
      (error) => console.error("Error fetching reports:", error)
    );

    return () => {
      unsubProjects();
      unsubReports();
    };
  }, [profile?.tenantId]);

  const reportsWithProjects = reports.map(r => ({
    ...r,
    project: projects.find(p => p.id === r.projectId)
  }));

  const filteredReports = reportsWithProjects.filter(report => {
    // Status filter
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    
    // Date range filter
    if (filterStartDate && report.date < filterStartDate) return false;
    if (filterEndDate && report.date > filterEndDate) return false;
    
    return true;
  });

  const handleAddActivity = () => {
    setActivities([...activities, { dayNumber: activities.length > 0 ? activities[activities.length - 1].dayNumber + 1 : 1, description: '' }]);
  };

  const handleActivityChange = (index: number, field: string, value: string | number) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid || !projectId) return;

    setIsSubmitting(true);
    try {
      let photoUrl = '';
      if (photo) {
        photoUrl = await uploadImage(photo, `reports/${projectId}`);
      }

      // Cari laporan yang sudah ada untuk project & tanggal ini
      const existingQuery = query(
        collection(db, 'reports'), 
        where('projectId', '==', projectId), 
        where('date', '==', date)
      );
      const existingSnap = await getDocs(existingQuery);
      
      let reportId = '';
      
      const selectedProject = projects.find(p => p.id === projectId);
      const projectName = selectedProject?.name || 'Unknown Project';

      if (!existingSnap.empty) {
        // Upsert: Tambahkan ke laporan yang sudah ada
        const existingDoc = existingSnap.docs[0];
        reportId = existingDoc.id;
        const existingData = existingDoc.data() as Report;
        
        const updates: any = {};
        if (photoUrl) updates.photoUrl = photoUrl;
        if (workerCount > 0) updates.workerCount = workerCount;
        if (issues) {
          updates.issues = existingData.issues ? `${existingData.issues}\n\n[Tambahan]: ${issues}` : issues;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'reports', reportId), updates);
        }
        await logActivity(profile.tenantId, profile.uid, profile.name, 'UPDATE', 'Report', `Grup Laporan untuk proyek ${projectName} diperbarui`, reportId);

      } else {
        // Buat laporan baru
        const reportRef = await addDoc(collection(db, 'reports'), {
          projectId,
          projectName: selectedProject?.name || 'Unknown Project',
          projectCustomId: selectedProject?.customId || null,
          tenantId: profile?.tenantId || '',
          userId: profile.uid,
          date,
          location,
          workerCount,
          issues,
          photoUrl,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        reportId = reportRef.id;
        await logActivity(profile.tenantId, profile.uid, profile.name, 'CREATE', 'Report', `Laporan baru untuk proyek ${projectName} dibuat`, reportId);

        // Notif to Admin/Manager if PC
        if (profile.role === 'pc') {
          const qRole = query(collection(db, 'users'), where('tenantId', '==', profile.tenantId));
          const usersSnap = await getDocs(qRole);
          const managers = usersSnap.docs.filter(d => ['admin', 'manager'].includes(d.data().role));
          for (const m of managers) {
            await sendNotification(
              profile.tenantId, 
              m.id, 
              "Laporan Baru Menunggu", 
              `Project Coordinator ${profile.name} telah mengirimkan laporan baru untuk proyek ${projectName}.`
            );
          }
        }
      }

      // Tambahkan aktivitas baru
      let maxDayNumber = 0;
      for (const act of activities) {
        if (act.description.trim()) {
          const numDay = Number(act.dayNumber) || 0;
          await addDoc(collection(db, 'activities'), {
            reportId: reportId,
            projectId,
            tenantId: profile?.tenantId || '',
            dayNumber: numDay,
            date,
            description: act.description,
            createdAt: new Date().toISOString()
          });
          if (numDay > maxDayNumber) {
            maxDayNumber = numDay;
          }
        }
      }

      // Update progress Project otomatis
      if (maxDayNumber > 0) {
        const projRef = doc(db, 'projects', projectId);
        const projSnap = await getDoc(projRef);
        if (projSnap.exists()) {
          const projData = projSnap.data() as Project;
          const currentMaxDay = Math.max(projData.currentDay || 0, maxDayNumber);
          const estDays = projData.estimatedDays || 1;
          let newProgress = (currentMaxDay / estDays) * 100;
          if (newProgress > 100) newProgress = 100;

          await updateDoc(projRef, {
            currentDay: currentMaxDay,
            progress: newProgress
          });
        }
      }

      setIsModalOpen(false);
      resetForm();
      if (profile?.role === 'pc') {
        alert("Laporan berhasil dikirim!");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Gagal mengirim laporan. Jika file terlalu besar, coba foto lain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectId('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setIssues('');
    setPhoto(null);
    setActivities([{ dayNumber: 1, description: '' }]);
  };

  const handleApproval = async (report: Report, status: 'approved' | 'rejected') => {
    if (!report.id || !profile) return;
    try {
      await updateDoc(doc(db, 'reports', report.id), { status });
      await logActivity(profile.tenantId, profile.uid, profile.name, 'APPROVE', 'Report', `Laporan proyek ${report.projectName || ''} berstatus ${status}`, report.id);

      // Notifikasi ke PC/pengirim:
      if (report.userId) {
        await sendNotification(
          profile.tenantId,
          report.userId,
          `Laporan Anda ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
          `Laporan untuk proyek ${report.projectName} pada ${report.date} telah ${status === 'approved' ? 'disetujui' : 'ditolak'} oleh Manager.`
        );
      }

      if (status === 'approved') {
        const project = projects.find(p => p.id === report.projectId);
        if (project && project.id) {
          const q = query(collection(db, 'activities'), where('reportId', '==', report.id));
          const snapshot = await getDocs(q);
          const reportActivities = snapshot.docs.map(d => d.data() as Activity);
          
          if (reportActivities.length > 0) {
            const maxDayInReport = Math.max(...reportActivities.map(a => a.dayNumber));
            
            if (maxDayInReport > project.currentDay) {
              const progress = Math.min((maxDayInReport / project.estimatedDays) * 100, 100);
              
              await updateDoc(doc(db, 'projects', project.id), {
                currentDay: maxDayInReport,
                progress
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if(!profile) return;
    try {
      // 1. Delete the report
      await deleteDoc(doc(db, 'reports', reportId));
      
      // 2. Delete associated activities
      const q = query(collection(db, 'activities'), where('reportId', '==', reportId));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'activities', d.id)));
      await Promise.all(deletePromises);
      
      await logActivity(profile.tenantId, profile.uid, profile.name, 'DELETE', 'Report', `Laporan telah dihapus`, reportId);
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Gagal menghapus laporan");
    }
  };

  const exportToPDF = async (report: Report & { project?: Project }) => {
    const doc = new jsPDF();
    
    // Add Company Header
    if (tenant) {
      doc.setFontSize(16);
      doc.text(tenant.name || 'ConstructDash', 14, 20);
      doc.setFontSize(10);
      doc.text(tenant.address || 'Alamat Belum Diatur', 14, 26);
      doc.text(`Tel: ${tenant.phone || '-'} | Email: ${tenant.email || '-'}`, 14, 32);
      
      // Divider
      doc.setDrawColor(200);
      doc.line(14, 35, 196, 35);
    }
    
    doc.setFontSize(14);
    doc.text('Laporan Harian Proyek', 14, tenant ? 45 : 22);
    
    const startYParams = tenant ? 55 : 32;
    doc.setFontSize(11);
    const projectName = report.project?.name || report.projectName || 'Unknown';
    const customId = report.project?.customId || report.projectCustomId || '';
    doc.text(`Project: ${projectName} ${customId ? `(${customId})` : ''}`, 14, startYParams);
    doc.text(`Tanggal: ${new Date(report.date).toLocaleDateString('id-ID')}`, 14, startYParams + 6);
    doc.text(`Lokasi: ${report.location}`, 14, startYParams + 12);
    doc.text(`Pekerja: ${report.workerCount || 0} Orang`, 14, startYParams + 18);
    doc.text(`Status: ${report.status.toUpperCase()}`, 14, startYParams + 24);
    doc.text(`Kendala: ${report.issues || '-'}`, 14, startYParams + 30);

    let currentY = startYParams + 36;

    // Add image to PDF if exists
    if (report.photoUrl) {
      try {
        let imageData = report.photoUrl;
        
        // If it's a URL (Firebase Storage), fetch it and convert to base64
        if (report.photoUrl.startsWith('http')) {
          const response = await fetch(report.photoUrl);
          const blob = await response.blob();
          imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
        
        if (imageData && imageData.startsWith('data:image')) {
          doc.text(`Dokumentasi:`, 14, currentY);
          currentY += 5;
          // Add image (x, y, width, height)
          doc.addImage(imageData, 'JPEG', 14, currentY, 80, 60);
          currentY += 65;
        } else {
          doc.text(`Link Foto Dokumentasi: Tersedia (Lihat di sistem)`, 14, currentY);
          currentY += 10;
        }
      } catch (e) {
        console.error("Failed to add image to PDF", e);
        doc.text(`Link Foto Dokumentasi: Tersedia (Lihat di sistem)`, 14, currentY);
        currentY += 10;
      }
    }

    // Fetch activities for this report
    let activitiesData: any[] = [];
    try {
      const q = query(collection(db, 'activities'), where('reportId', '==', report.id));
      const snapshot = await getDocs(q);
      activitiesData = snapshot.docs.map(d => d.data() as Activity).sort((a, b) => a.dayNumber - b.dayNumber);
    } catch (error) {
      console.error("Error fetching activities for PDF", error);
    }

    const tableData = activitiesData.map(act => [
      `Hari ke-${act.dayNumber}`,
      act.description
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Hari Ke', 'Deskripsi Pekerjaan']],
      body: tableData.length > 0 ? tableData : [['-', 'Tidak ada data aktivitas']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Report_${projectName}_${report.date}.pdf`);
  };

  const exportToCSV = async (report: Report & { project?: Project }) => {
    let activitiesData: Activity[] = [];
    try {
      const q = query(collection(db, 'activities'), where('reportId', '==', report.id));
      const snapshot = await getDocs(q);
      activitiesData = snapshot.docs.map(d => d.data() as Activity).sort((a, b) => a.dayNumber - b.dayNumber);
    } catch (error) {
      console.error("Error fetching activities for CSV", error);
    }

    const headers = ['Project', 'Tanggal', 'Lokasi', 'Pekerja', 'Status', 'Kendala', 'Hari Ke', 'Deskripsi Pekerjaan'];
    const projectName = report.project?.name || report.projectName || 'Unknown';
    const customId = report.project?.customId || report.projectCustomId || '';
    const projectDisplay = customId ? `${projectName} (${customId})` : projectName;

    const rows = activitiesData.map(act => [
      projectDisplay,
      report.date,
      report.location,
      report.workerCount || 0,
      report.status,
      report.issues || '-',
      act.dayNumber,
      act.description
    ]);

    if (rows.length === 0) {
      rows.push([projectDisplay, report.date, report.location, report.workerCount || 0, report.status, report.issues || '-', '-', '-']);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_${projectName}_${report.date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    const exportData = filteredReports.map(r => {
      const projectName = r.project?.name || r.projectName || 'Unknown';
      const customId = r.project?.customId || r.projectCustomId || '';
      return {
        'ID Proyek': customId,
        'Nama Proyek': projectName,
        'Tanggal Laporan': r.date,
        'Lokasi': r.location,
        'Status': r.status.toUpperCase(),
        'Jumlah Pekerja': r.workerCount || 0,
        'Kendala': r.issues || '-'
      };
    });
    exportDataToCSV(exportData, `Daftar_Laporan_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {profile?.role !== 'pc' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Laporan Harian</h1>
            <div className="flex w-full sm:w-auto items-center gap-3">
              <button
                onClick={handleExportAll}
                className="bg-white text-gray-700 px-3 py-2.5 rounded-xl flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-all font-medium whitespace-nowrap"
                title="Export Semua Data Laporan"
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                <span className="hidden sm:inline">Export Semua</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 shrink-0 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all font-medium"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Buat Laporan</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-end">
               <button
                 onClick={() => { setFilterStatus('all'); setFilterStartDate(''); setFilterEndDate(''); }}
                 className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full md:w-auto"
               >
                 Reset Filter
               </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p>Tidak ada laporan yang sesuai dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(report.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{report.project?.name || report.projectName || <span className="text-red-500 italic">[Project Terhapus]</span>}</span>
                      {(report.project?.customId || report.projectCustomId) && (
                        <span className="text-xs text-blue-600 font-semibold">{report.project?.customId || report.projectCustomId}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'approved' ? 'bg-green-100 text-green-800' :
                      report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3 items-center">
                      {report.photoUrl && (
                        <button 
                          onClick={() => setViewImage(report.photoUrl)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Lihat Foto"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => exportToCSV(report)}
                        className="text-green-600 hover:text-green-800"
                        title="Download CSV/Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>
                      <button 
                        onClick={() => exportToPDF(report)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      
                      {(profile?.role === 'admin' || profile?.role === 'manager') && report.status === 'pending' && (
                        <>
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                          <button 
                            onClick={() => handleApproval(report, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleApproval(report, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}

                      {profile?.role === 'admin' && (
                        <>
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                          <button 
                            onClick={() => report.id && setDeleteConfirmId(report.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Hapus Laporan"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setViewImage(null)}>
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => setViewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <img src={viewImage} alt="Dokumentasi" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Modal / Inline Buat Laporan */}
      {(isModalOpen || profile?.role === 'pc') && (
        <div className={profile?.role === 'pc' ? 'w-full' : 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'}>
          <div className={profile?.role === 'pc' ? 'bg-white rounded-xl shadow-sm border border-gray-200 w-full' : 'bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'}>
            <div className={`flex justify-between items-center p-4 border-b border-gray-100 bg-white ${profile?.role !== 'pc' ? 'sticky top-0 z-10' : ''}`}>
              <h2 className="text-lg font-bold text-gray-900">Buat Laporan Harian</h2>
              {profile?.role !== 'pc' && (
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Project</label>
                  <select
                    required
                    value={projectId}
                    onChange={e => {
                      setProjectId(e.target.value);
                      const proj = projects.find(p => p.id === e.target.value);
                      if (proj) {
                        setLocation(proj.location);
                        setActivities([{ dayNumber: proj.currentDay + 1, description: '' }]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Project --</option>
                    {projects.filter(p => p.status === 'active').map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.customId ? `(${p.customId})` : ''}</option>
                    ))}
                  </select>
                  {projectId && projects.find(p => p.id === projectId)?.customId && (
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      ID Project: {projects.find(p => p.id === projectId)?.customId}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pekerja</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={workerCount === 0 ? '' : workerCount}
                    onChange={e => setWorkerCount(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan jumlah pekerja"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-900">Aktivitas Pekerjaan</h3>
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Tambah Aktivitas
                  </button>
                </div>
                
                <div className="space-y-3">
                  {activities.map((act, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Hari Ke-</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={Number.isNaN(act.dayNumber) ? '' : act.dayNumber === 0 ? '' : act.dayNumber}
                          onChange={e => handleActivityChange(idx, 'dayNumber', e.target.value === '' ? 0 : parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Deskripsi Pekerjaan</label>
                        <input
                          type="text"
                          required
                          value={act.description}
                          onChange={e => handleActivityChange(idx, 'description', e.target.value)}
                          placeholder="Contoh: Pemasangan sandwich panel"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      {activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setActivities(activities.filter((_, i) => i !== idx))}
                          className="mt-6 text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kendala (Opsional)</label>
                <textarea
                  value={issues}
                  onChange={e => setIssues(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tuliskan kendala di lapangan jika ada..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Dokumentasi</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setPhoto(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    {photo && <p className="text-sm text-green-600 font-medium mt-2">Selected: {photo.name}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-4">
                {profile?.role !== 'pc' && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteReport(deleteConfirmId)}
        title="Hapus Laporan"
        message="Yakin ingin menghapus laporan ini beserta semua aktivitasnya? Aksi ini tidak dapat dibatalkan."
      />
    </div>
  );
}
