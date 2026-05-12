import React, { useState } from 'react';
import { BookOpen, Shield, Users, FileText, FolderKanban, LayoutDashboard, CheckCircle, Wallet, HelpCircle, ChevronRight, Zap, Settings, Download, Bell, Activity } from 'lucide-react';
import { useAuth } from '../lib/auth';
import clsx from 'clsx';

export function Guide() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');

  const role = String(profile?.role || '').toLowerCase().trim();
  const isAdmin = role === 'admin';
  const isPM = role === 'manager';
  const isPC = role === 'pc';

  const menuItems = [
    { id: 'getting-started', label: 'Memulai SIMPROKA', icon: <Zap size={18} /> },
    { id: 'roles', label: 'Hak Akses & Peran', icon: <Shield size={18} /> },
    { id: 'projects', label: 'Manajemen Proyek', icon: <FolderKanban size={18} /> },
    { id: 'reports', label: 'Laporan Harian', icon: <FileText size={18} /> },
    ...(isAdmin || isPM ? [{ id: 'finance', label: 'Keuangan', icon: <Wallet size={18} /> }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Kelengkapan Sistem (Admin)', icon: <Settings size={18} /> }] : []),
    { id: 'faq', label: 'FAQ', icon: <HelpCircle size={18} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto min-h-[80vh] flex flex-col md:flex-row gap-8 pb-20 mt-4">
      {/* Sidebar Navigation */}
      <div className="md:w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={20} />
            <h2 className="font-bold text-gray-900">Pusat Bantuan</h2>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors",
                  activeSection === item.id 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className={clsx(activeSection === item.id ? "text-blue-600" : "text-gray-400")}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-10 mb-20 md:mb-0">
        
        {activeSection === 'getting-started' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Selamat Datang di SIMPROKA</h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                SIMPROKA adalah solusi Software-as-a-Service (SaaS) manajemen proyek konstruksi profesional. Kami membantu perusahaan Anda memantau progres lapangan, menyetujui laporan harian, melacak anggaran, dan mengawasi aktivitas sistem secara real-time.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">1</div>
                <h3 className="font-bold text-gray-900 mb-2">Setup Perusahaan (Admin)</h3>
                <p className="text-sm text-gray-600">Masuk ke menu <span className="font-semibold text-gray-800">Pengaturan</span> untuk menyesuaikan nama perusahaan dan mendaftarkan pengguna baru (Manager atau PC).</p>
              </div>
              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">2</div>
                <h3 className="font-bold text-gray-900 mb-2">Buat Proyek</h3>
                <p className="text-sm text-gray-600">Masuk ke <span className="font-semibold text-gray-800">Daftar Project</span>, klik tombol Tambah. Proyek akan menjadi wadah semua laporan dan transaksi.</p>
              </div>
              <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">3</div>
                <h3 className="font-bold text-gray-900 mb-2">Laporan Harian</h3>
                <p className="text-sm text-gray-600">Koordinator Lapangan mengisi laporan. Manajer atau Admin menyetujuinya, yang otomatis menaikkan progress (%).</p>
              </div>
              <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">4</div>
                <h3 className="font-bold text-gray-900 mb-2">Ekspor & Audit</h3>
                <p className="text-sm text-gray-600">Cetak PDF dan ekspor CSV kapan saja. Admin dapat melihat log setiap aksi pengguna di menu Audit.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'roles' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Hak Akses & Peran Pengguna</h1>
              <p className="text-lg text-gray-600 leading-relaxed">SIMPROKA menggunakan sistem Role-Based Access Control (RBAC) yang ketat untuk memastikan integritas dan keamanan data.</p>
            </div>

            <div className="space-y-6 mt-6">
              <div className="p-6 border border-gray-200 rounded-2xl shadow-sm">
                <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2"><Shield className="text-purple-600" size={24} /> Admin</h3>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Mengelola profil perusahaan dan mengubah nama pengguna</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Akses penuh untuk membuat, mengubah role, dan menghapus Pengguna</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Menyetujui/Menolak serta <strong>Menghapus</strong> semua laporan dan proyek</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Akses terhadap seluruh data keuangan perusahaan</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Mengekspor data ke CSV serta melihat <strong>Audit Logs (Aktivitas Sistem)</strong></li>
                </ul>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl shadow-sm">
                <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2"><Shield className="text-blue-600" size={24} /> Project Manager (PM)</h3>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Membuat dan mengedit data proyek (namun tidak bisa menghapus proyek)</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Menyetujui atau Menolak laporan harian dari Project Coordinator</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Memantau notifikasi dan progres otomatis dari sistem</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Akses penuh terhadap modul Keuangan (mencatat arus kas & anggaran)</li>
                </ul>
              </div>

              <div className="p-6 border border-gray-200 rounded-2xl shadow-sm">
                <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2"><Shield className="text-emerald-600" size={24} /> Project Coordinator (PC)</h3>
                <ul className="mt-4 space-y-3 text-gray-600">
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Mengisi laporan harian (jumlah pekerja, kendala, aktivitas lapangan)</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Mengunggah foto dokumentasi proyek ke sistem</li>
                  <li className="flex gap-3"><CheckCircle className="text-gray-400 mt-0.5 shrink-0" size={18}/> Mengekspor laporannya sendiri dalam format PDF atau CSV</li>
                  <li className="flex gap-3 bg-red-50 p-2 rounded text-red-800"><CheckCircle className="text-red-500 shrink-0" size={18}/> <strong>Diblokir</strong> secara mutlak dari halaman Keuangan, Users, dan Pengaturan</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Manajemen Proyek</h1>
              <p className="text-lg text-gray-600 leading-relaxed">Menyediakan pusat informasi untuk semua proyek yang berjalan beserta detail kontrak dan progres estimatifnya.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h4 className="font-bold text-gray-900 mb-2">Automasi Progres (%)</h4>
                <p className="text-sm text-gray-600">Setiap Laporan Harian yang disetujui (Approved) akan mengecek "Hari Ke-" terbesar dan menghitung progress secara otomatis dibandingkan "Estimasi Total Hari" proyek.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h4 className="font-bold text-gray-900 mb-2">Export Data CSV</h4>
                <p className="text-sm text-gray-600">Terdapat tombol untuk mendownload seluruh informasi master proyek ke format .csv yang mudah diolah di Microsoft Excel atau sistem ERP eksternal.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Laporan Harian Lapangan</h1>
              <p className="text-lg text-gray-600 leading-relaxed">Fitur esensial untuk memantau kemajuan riil lapangan. Sistem mengakomodasi input foto, rincian harian, kendala, dan notifikasi persetujuan (approval workflow).</p>
            </div>

            <div className="space-y-5 text-gray-600">
               <div className="flex gap-4">
                 <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Download size={20} /></div>
                 <div>
                   <h4 className="font-bold text-gray-900">Download Dokumen (PDF & CSV)</h4>
                   <p className="text-sm mt-1">Setiap laporan menyediakan dua opsi download: PDF untuk pelaporan resmi (dicetak lengkap dengan foto) serta CSV untuk pengolahan rekap data.</p>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-10 h-10 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><CheckCircle size={20} /></div>
                 <div>
                   <h4 className="font-bold text-gray-900">Alur Persetujuan (Approval)</h4>
                   <p className="text-sm mt-1">Manager/Admin harus menekan tombol setuju atau tolak. Jika disetujui, progress proyek akan naik. <strong>Sekarang terhubung ke sistem NOTIFIKASI yang dimunculkan ke pembuat laporan via simbol lonceng.</strong></p>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'finance' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Keuangan (Finance)</h1>
              <p className="text-lg text-gray-600 leading-relaxed">Pantau arus kas dan budget khusus masing-masing proyek secara akurat.</p>
            </div>
            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl shadow-lg">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Wallet /> Ruang Ringkup</h4>
                <p className="text-gray-300 text-sm">Modul keuangan memastikan dana masuk (Termin/Invoice) dapat menutupi dana keluar (Bahan, Alat, Tukang). Setiap modul akan memiliki sub-kategori Budget, Kas (Cashflow), dan Expense.</p>
            </div>
          </div>
        )}

        {activeSection === 'admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Fitur Kelengkapan Sistem Terpadu</h1>
              <p className="text-lg text-gray-600 leading-relaxed">Sebagai aplikasi SaaS Enterprise modern, SIMPROKA hadir dengan komponen esensial untuk visibilitas dan kepatuhan (compliance).</p>
            </div>

            <div className="grid gap-6">
              <div className="border border-gray-200 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700"><Activity size={24} /></div>
                   <h3 className="font-bold text-gray-900 text-xl">Audit Log (Log Riwayat Aktivitas)</h3>
                 </div>
                 <p className="text-gray-600 text-sm">Fitur esensial keamanan. Setiap interaksi seperti pembuatan proyek baru, pembaruan data, hingga persetujuan laporan akan direkam. Anda (Admin) dapat melihat riwayat siapa yang mengedit/menghapus secara realtime pada halaman <strong>Pengaturan {'>'} Audit Log</strong>.</p>
              </div>

              <div className="border border-gray-200 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-rose-100 rounded-lg text-rose-700"><Bell size={24} /></div>
                   <h3 className="font-bold text-gray-900 text-xl">Notifikasi Real-time & Inbox Lonceng</h3>
                 </div>
                 <p className="text-gray-600 text-sm">Sistem Lonceng (Icon Bell di navigasi atas/sidebar) beroperasi dengan <em>Listener Firestore</em>. Ketika Koordinator menyetor Laporan, Manager menerimanya otomatis. Ketika Manager menolak/menerima, Koordinator turut menerima notifikasi dengan format tanggal dan rincian pesan.</p>
              </div>

               <div className="border border-gray-200 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-teal-100 rounded-lg text-teal-700"><Settings size={24} /></div>
                   <h3 className="font-bold text-gray-900 text-xl">Kustomisasi Profil (Multi-Tenant)</h3>
                 </div>
                 <p className="text-gray-600 text-sm">Sebagai pengguna layanan SaaS, data Anda terisolasi oleh <em>Tenant ID</em> (Sistem Perusahaan). Anda dapat merubah Nama Profil sendiri dan merubah profil instansi melalui menu Pengaturan, memastikan isolasi privasi perusahaan Anda terjamin.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Pertanyaan Populer</h1>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-900">Siapa saja yang dapat mendaftar perusahaan di SIMPROKA?</h4>
                <p className="text-sm text-gray-600 mt-2">Setiap pihak yang memiliki email valid dapat melakukan login. Email pengguna pertama yang mendaftar dan tidak memiliki pertautan Tenant akan otomatis membuat "Kamar Server" (Tenant) dan menjadikan dirinya <strong>Admin</strong>. Setelah itu, admin bisa menambahkan akun manajer atau koordinator sendiri tanpa perlu pendaftaran manual.</p>
              </div>
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-900">Dimana saya bisa melihat log perubahan bila seseorang menghapus laporan?</h4>
                <p className="text-sm text-gray-600 mt-2">Jika Anda adalah Admin, pergi ke menu <strong>Pengaturan</strong> lalu buka tab <strong>Audit Log</strong>. Segala log Delete (warna merah) atau Update (warna kuning) akan tercantum bersama jam aktivitas dan identitas pegawainya.</p>
              </div>
               <div className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                <h4 className="font-bold text-gray-900">Bagaimana fitur notifikasinya bekerja?</h4>
                <p className="text-sm text-gray-600 mt-2">Setiap aksi (seperti pengajuan laporan baru dari PC, atau approval/penolakan dari Manager) akan memicu dokumen Notifikasi baru menuju database Firebase Firestore yang otomatis menyala sebagai badge dot merah di lonceng pojok kanan aplikasi klien tujuan Anda. Anda tinggal klik dan tandai semua telah dibaca.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
