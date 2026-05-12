import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db, Project } from '../lib/db';
import { useAuth } from '../lib/auth';
import { Plus, Edit2, Trash2, X, Search, FileText, Download } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportToCSV } from '../lib/export';
import { logActivity } from '../lib/audit';

import { CurrencyInput } from '../components/CurrencyInput';

export function Projects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    customId: '',
    location: '',
    startDate: '',
    deadline: '',
    estimatedDays: 0,
    contractValue: 0,
    status: 'active' as 'active' | 'completed' | 'delayed'
  });

  useEffect(() => {
    if (!profile?.tenantId) return;
    const unsub = onSnapshot(query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId)), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    return () => unsub();
  }, [profile?.tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.estimatedDays <= 0) {
      setErrorMsg("Estimasi hari harus lebih dari 0");
      return;
    }
    if (!profile) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (editingProject?.id) {
        await updateDoc(doc(db, 'projects', editingProject.id), {
          ...formData,
        });
        await logActivity(profile.tenantId, profile.uid, profile.name, 'UPDATE', 'Project', `Proyek ${formData.name} diperbarui`, editingProject.id);
      } else {
        const ref = await addDoc(collection(db, 'projects'), {
          ...formData,
          tenantId: profile?.tenantId || '',
          currentDay: 0,
          progress: 0,
          createdAt: new Date().toISOString()
        });
        await logActivity(profile.tenantId, profile.uid, profile.name, 'CREATE', 'Project', `Proyek baru bernama ${formData.name} dibuat`, ref.id);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving project:", error);
      setErrorMsg("Gagal menyimpan project. Pastikan koneksi atau izin valid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!profile) return;
    try {
      const proj = projects.find(p => p.id === id);
      await deleteDoc(doc(db, 'projects', id));
      await logActivity(profile.tenantId, profile.uid, profile.name, 'DELETE', 'Project', `Proyek ${proj?.name || ''} dihapus`, id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Gagal menghapus project");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      customId: '',
      location: '',
      startDate: '',
      deadline: '',
      estimatedDays: 0,
      contractValue: 0,
      status: 'active'
    });
    setEditingProject(null);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      customId: project.customId || '',
      location: project.location,
      startDate: project.startDate.split('T')[0],
      deadline: project.deadline.split('T')[0],
      estimatedDays: project.estimatedDays,
      contractValue: project.contractValue || 0,
      status: project.status
    });
    setIsModalOpen(true);
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    return project.name.toLowerCase().includes(query) || 
           project.location.toLowerCase().includes(query);
  });

  const handleExport = () => {
    const exportData = filteredProjects.map(p => ({
      'ID Proyek': p.customId || p.id,
      'Nama Proyek': p.name,
      'Lokasi': p.location,
      'Status': p.status,
      'Progress (%)': p.progress.toFixed(1),
      'Mulai': new Date(p.startDate).toLocaleDateString('id-ID'),
      'Tenggat Waktu': new Date(p.deadline).toLocaleDateString('id-ID'),
      'Estimasi Hari': p.estimatedDays,
      'Nilai Kontrak (Rp)': p.contractValue || 0
    }));
    exportToCSV(exportData, `Data_Proyek_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Proyek</h1>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari project atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
            />
          </div>
          
          <button
            onClick={handleExport}
            className="bg-white text-gray-700 px-3 py-2.5 rounded-xl flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-all font-medium whitespace-nowrap"
            title="Export ke CSV"
          >
            <Download size={18} />
             <span className="hidden sm:inline">Export</span>
          </button>

          {profile?.role === 'admin' && (
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-blue-600 shrink-0 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all font-medium whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tambah Proyek</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight">{project.name}</h3>
                {project.customId && <p className="text-xs font-semibold text-blue-600 mb-1.5 px-2 py-0.5 bg-blue-50 inline-block rounded-md">{project.customId}</p>}
                <p className="text-sm text-gray-500">{project.location}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-md border text-[10px] uppercase font-bold tracking-wider ${
                project.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                project.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                'bg-red-50 text-red-700 border-red-200/50'
              }`}>
                {project.status}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 font-medium">Progress</span>
                <span className="font-bold text-gray-900">{project.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${project.progress < 30 ? 'bg-red-500' : project.progress < 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-gray-400 text-right">
                Hari {project.currentDay} dari {project.estimatedDays}
              </p>
            </div>

            <div className="text-sm text-gray-500 space-y-1.5 mb-6 flex-1">
              <p className="flex justify-between"><span>Mulai:</span> <strong className="text-gray-900 font-medium">{new Date(project.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</strong></p>
              <p className="flex justify-between"><span>Tenggat:</span> <strong className="text-gray-900 font-medium">{new Date(project.deadline).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</strong></p>
              {project.contractValue ? <p className="flex justify-between mt-2 pt-2 border-t border-gray-50"><span>Nilai Kontrak:</span> <strong className="text-gray-900">Rp {project.contractValue.toLocaleString('id-ID')}</strong></p> : null}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
              <Link
                to={`/projects/${project.id}`}
                className={`${canEdit ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm`}
              >
                <FileText size={16} /> Detail
              </Link>
              
              {canEdit && (
                <>
                  <button
                    onClick={() => openEditModal(project)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => project.id && setDeleteConfirmId(project.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 size={16} /> Hapus
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 px-4 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-gray-400" />
             </div>
            <p className="text-gray-900 font-medium mb-1">Tidak ada proyek yang ditemukan</p>
            <p className="text-sm">Silakan ubah kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProject ? 'Edit Project' : 'Tambah Project Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Project</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Project (Opsional)</label>
                <input
                  type="text"
                  value={formData.customId}
                  onChange={e => setFormData({...formData, customId: e.target.value})}
                  placeholder="Contoh: PRJ-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Hari Pengerjaan</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={Number.isNaN(formData.estimatedDays) ? '' : formData.estimatedDays === 0 ? '' : formData.estimatedDays}
                  onChange={e => setFormData({...formData, estimatedDays: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Kontrak (Rp) - Opsional</label>
                <CurrencyInput
                  value={formData.contractValue || 0}
                  onChange={val => setFormData({...formData, contractValue: val})}
                  placeholder="Contoh: 150000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editingProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Hapus Project"
        message="Yakin ingin menghapus project ini secara permanen?"
      />
    </div>
  );
}
