import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, Project, Report } from '../lib/db';
import { Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, FileText, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    const unsubReports = onSnapshot(query(collection(db, 'reports')), (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reps);
    });

    const unsubRecentReports = onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setRecentReports(reps);
    });

    return () => {
      unsubProjects();
      unsubReports();
      unsubRecentReports();
    };
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const delayedProjects = projects.filter(p => p.status === 'delayed').length;

  const today = new Date().toISOString().split('T')[0];
  const reportsToday = reports.filter(r => r.date.startsWith(today)).length;
  
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  // Upcoming deadlines (active projects sorted by deadline)
  const upcomingDeadlines = projects
    .filter(p => p.status === 'active')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {profile?.name}</p>
        </div>
      </div>

      {/* Pending Approvals Alert for Admin/Manager */}
      {(profile?.role === 'admin' || profile?.role === 'manager') && pendingReports > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-700">
                Ada <span className="font-bold">{pendingReports} laporan harian</span> yang menunggu persetujuan Anda.
              </p>
            </div>
            <Link to="/reports" className="text-sm font-medium text-yellow-700 hover:text-yellow-600 flex items-center">
              Lihat <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Project Aktif</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{activeProjects}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Activity className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Project Selesai</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{completedProjects}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Project Delay</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{delayedProjects}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Laporan Hari Ini</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{reportsToday}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <FileText className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Progress (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Progress Project Aktif
            </h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[400px]">
            {projects.filter(p => p.status === 'active').map(project => (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <span className="text-sm font-semibold text-blue-600">{project.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${project.progress < 30 ? 'bg-red-500' : project.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> Hari ke-{project.currentDay} dari {project.estimatedDays}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Deadline: {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {activeProjects === 0 && (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <CheckCircle2 size={48} className="text-gray-300 mb-3" />
                <p>Tidak ada project aktif saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Recent Reports */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                Deadline Terdekat
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingDeadlines.map(project => {
                const daysLeft = Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                return (
                  <div key={project.id} className="p-4">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{project.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        daysLeft < 0 ? 'bg-red-100 text-red-700' : 
                        daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {daysLeft < 0 ? `Terlewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {upcomingDeadlines.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Tidak ada deadline terdekat.
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-purple-600" />
                Laporan Terbaru
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentReports.map(report => {
                const project = projects.find(p => p.id === report.projectId);
                return (
                  <div key={report.id} className="p-4 flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{project?.name || 'Unknown Project'}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      report.status === 'approved' ? 'bg-green-100 text-green-800' :
                      report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                );
              })}
              {recentReports.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Belum ada laporan.
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center bg-gray-50">
              <Link to="/reports" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                Lihat Semua Laporan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
