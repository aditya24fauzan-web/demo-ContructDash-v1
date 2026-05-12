import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db, Project, Report } from '../lib/db';
import { Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, FileText, Calendar, ChevronRight, BarChart as BarChartIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

export function Dashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsubProjects = onSnapshot(query(collection(db, 'projects'), where('tenantId', '==', profile.tenantId)), (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    const unsubReports = onSnapshot(query(collection(db, 'reports'), where('tenantId', '==', profile.tenantId)), (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reps);
    });

    const unsubRecentReports = onSnapshot(query(collection(db, 'reports'), where('tenantId', '==', profile.tenantId), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setRecentReports(reps);
    });

    return () => {
      unsubProjects();
      unsubReports();
      unsubRecentReports();
    };
  }, [profile?.tenantId]);

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

  // Chart Data: Progress Proyek Aktif
  const activeProjectsData = projects
    .filter(p => p.status === 'active')
    .map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      progress: Math.round(p.progress),
      fullName: p.name,
      fill: p.progress < 30 ? '#ef4444' : p.progress < 70 ? '#fbbf24' : '#10b981'
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 7); // Max 7 for the chart

  // Chart Data: Tren Laporan 7 Hari Terakhir
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const reportsTrendData = last7Days.map(date => {
    const count = reports.filter(r => r.date.startsWith(date)).length;
    return {
      date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      Laporan: count,
      fullDate: date
    }
  });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pantau perkembangan proyek dan laporan terkini.</p>
        </div>
      </div>

      {/* Pending Approvals Alert for Admin/Manager */}
      {(profile?.role === 'admin' || profile?.role === 'manager') && pendingReports > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl shadow-sm mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full mr-4">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Ada <span className="font-bold">{pendingReports} laporan harian</span> yang menunggu persetujuan Anda.
            </p>
          </div>
          <Link to="/reports" className="text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/50 hover:bg-amber-200/50 dark:hover:bg-amber-800/60 px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center">
            Review Laporan <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeProjects}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Proyek Aktif</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-green-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedProjects}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Proyek Selesai</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-red-50 dark:bg-rose-900/30 text-red-600 dark:text-rose-400 rounded-xl">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{delayedProjects}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Proyek Tertunda</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{reportsToday}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Laporan Hari Ini</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Trend Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><Activity size={18} /></span>
              Aktivitas Laporan
            </h2>
          </div>
          <div className="p-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportsTrendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="dark:stroke-gray-700 opacity-50 dark:opacity-100" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(31, 41, 55, 0.95)', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#9ca3af', marginBottom: '4px' }}
                />
                <Line type="monotone" name="Jumlah Laporan" dataKey="Laporan" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#1f2937' }} activeDot={{ r: 6 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Projects Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><BarChartIcon size={18} /></span>
              Progress Proyek Tertinggi
            </h2>
          </div>
          <div className="p-6 h-[300px] w-full">
            {activeProjectsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeProjectsData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="dark:stroke-gray-700 opacity-50 dark:opacity-100" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(55, 65, 81, 0.1)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(31, 41, 55, 0.95)', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#9ca3af', marginBottom: '4px' }}
                  />
                  <Bar dataKey="progress" name="Progress (%)" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1500}>
                    {activeProjectsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <BarChartIcon size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p>Belum ada proyek aktif.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Progress (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><TrendingUp size={18} /></span>
              Progress Proyek Aktif
            </h2>
            <Link to="/projects" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700 flex-1 overflow-y-auto max-h-[400px]">
            {projects.filter(p => p.status === 'active').map(project => (
              <div key={project.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors group">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h3>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{project.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${project.progress < 30 ? 'bg-red-500' : project.progress < 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md"><Clock size={12} /> Hari ke-{project.currentDay} / {project.estimatedDays}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> Tenggat: {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {activeProjects === 0 && (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">Bagus!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tidak ada proyek aktif saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Recent Reports */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-lg"><Clock size={16} /></span>
                Tenggat Terdekat
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {upcomingDeadlines.map(project => {
                const daysLeft = Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                return (
                  <div key={project.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{project.name}</h3>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        daysLeft < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-transparent' : 
                        daysLeft <= 7 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-transparent' : 
                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-transparent'
                      }`}>
                        {daysLeft < 0 ? `Terlewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {upcomingDeadlines.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="mx-auto w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 size={20} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  Santai, tidak ada tenggat mendesak.
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
              <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><FileText size={16} /></span>
                Laporan Terbaru
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700 flex-1">
              {recentReports.map(report => {
                const project = projects.find(p => p.id === report.projectId);
                return (
                  <div key={report.id} className="p-4 flex items-start justify-between hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{project?.name || 'Unknown Project'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[10px] uppercase tracking-wide font-bold ${
                      report.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-transparent' :
                      report.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-transparent' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-transparent'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                );
              })}
              {recentReports.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="mx-auto w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <FileText size={20} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  Belum ada laporan yang masuk.
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-50 dark:border-gray-700 text-center bg-gray-50/50 dark:bg-gray-800">
              <Link to="/reports" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-1 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                Lihat Semua Laporan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
