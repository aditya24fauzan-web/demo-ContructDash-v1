import React from 'react';
import { BookOpen, Shield, Users, FileText, FolderKanban, LayoutDashboard, CheckCircle, Wallet, Info } from 'lucide-react';
import { useAuth } from '../lib/auth';
import clsx from 'clsx';

export function Guide() {
  const { profile } = useAuth();
  
  const role = String(profile?.role || '').toLowerCase().trim();
  const isAdmin = role === 'admin';
  const isPM = role === 'manager';
  const isPC = role === 'pc';

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-32 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <BookOpen className="mr-3 text-indigo-600" size={32} />
          Panduan Penggunaan
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-2 max-w-2xl">
          Pelajari cara menggunakan SIMPROKA (Sistem Manajemen Proyek & Keuangan) dan manfaatkan seluruh fiturnya sesuai dengan hak akses Anda.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Peran & Hak Akses Layer */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-2 text-indigo-600" size={24} />
              Peran & Hak Akses
            </h2>
            <p className="text-sm text-gray-500 mt-1">Struktur tingkatan pengguna dan wewenang di dalam sistem.</p>
          </div>
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <RoleCard 
                title="Admin" 
                color="purple" 
                items={[
                  "Akses penuh ke seluruh sistem",
                  "Manajemen User (Tambah/Hapus/Role)",
                  "Manajemen Project Lengkap",
                  "Akses penuh ke modul Keuangan",
                  "Validasi Laporan Proyek"
                ]} 
              />
              <RoleCard 
                title="Project Manager (PM)" 
                color="blue" 
                items={[
                  "Melihat Dashboard dan Statistik",
                  "Membuat dan mengelola Project",
                  "Melihat laporan seluruh terkait proyek",
                  "Akses ke modul Keuangan (Otentikasi)",
                ]} 
              />
              <RoleCard 
                title="Project Coordinator (PC)" 
                color="emerald" 
                items={[
                  "Fokus pada Pelaporan Lapangan",
                  "Mengirim Laporan Harian (Daily Report)",
                  "Upload progress & bukti lapangan",
                  "Tidak memiliki akses modul Keuangan"
                ]} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 border-b border-gray-50">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center mb-6">
              <FolderKanban className="mr-2 text-indigo-600" size={24} />
              Alur Kerja Utama (Workflow)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Siklus Proyek Baru
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-2">
                  <li><strong>Admin/PM</strong> membuat proyek baru melalui menu <span className="font-semibold">Daftar Project</span>.</li>
                  <li>Isi nama, klien, budget, dan tetapkan mandor (PIC).</li>
                  <li><strong>Admin/PM</strong> membuat Rencana Anggaran Biaya (RAB) di modul keuangan jika diperlukan.</li>
                  <li>Proyek berstatus <span className="text-blue-600 font-medium">Perencanaan</span>, ubah ke <span className="text-amber-600 font-medium">Berjalan</span> jika sudah mulai.</li>
                </ol>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                   <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Siklus Pelaporan Harian
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-2">
                  <li><strong>PC/Mandor</strong> membuka menu <span className="font-semibold">Laporan Harian</span>.</li>
                  <li>Pilih proyek yang sedang dikerjakan.</li>
                  <li>Isi kondisi cuaca, jumlah pekerja, material, dan alat.</li>
                  <li>Upload foto (1 file kolase disarankan) dan Submit.</li>
                  <li>Laporan akan tersimpan dan dapat diunduh (PDF) oleh <strong>Admin/PM</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Fitur Modul Layer */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(!isPC) && (
            <FeatureCard
              icon={LayoutDashboard}
              iconColor="text-blue-500"
              title="Dashboard Utama"
              description="Pusat informasi dan ringkasan status operasional."
              features={[
                { title: "Statistik Real-time", desc: "Menampilkan total proyek berdasarkan statusnya." },
                { title: "Aktivitas Terkini", desc: "Pantau laporan harian yang baru saja masuk secara langsung." },
                { title: "Notifikasi Cepat", desc: "Lihat ringkasan singkat progres di satu tempat tanpa harus masuk ke detail." },
              ]}
            />
          )}

          {(!isPC) && (
            <FeatureCard
              icon={FolderKanban}
              iconColor="text-indigo-500"
              title="Daftar & Detail Project"
              description="Manajemen dan pelacakan seluruh proyek konstruksi."
              features={[
                { title: "Buat Proyek Baru", desc: "Input proyek lengkap dengan detail klien, nilai kontrak, dan durasi." },
                { title: "Pantau Progres", desc: "Klik nama proyek untuk melihat rekam jejak laporan spesifik proyek tersebut." },
                { title: "Update Status", desc: "Ubah siklus: Perencanaan (Draft) → Berjalan (Aktif) → Selesai (Selesai)." },
                { title: "Hapus Proyek", desc: "Tersedia tombol hapus (ikon tong sampah) jika data tidak valid." }
              ]}
            />
          )}

          <FeatureCard
            icon={FileText}
            iconColor="text-emerald-500"
            title="Laporan Harian Lapangan"
            description="Modul entri data aktivitas konstruksi secara harian oleh tim lapangan."
            features={[
              { title: "Form Rekaman", desc: "Pilih tanggal, isi status cuaca pagi/siang/sore, jumlah pekerja, dan kendala." },
              { title: "Pekerjaan Harian", desc: "Catat jenis pekerjaan, material yang datang, dan penggunaan alat berat." },
              { title: "Bukti Visual", desc: "Wajib unggah foto (maks 10MB) per laporan sebagai bukti sah." },
              { title: "Cetak & Export PDF", desc: "Admin/PM dapat mendownload laporan menjadi slip PDF untuk diserahkan ke klien." },
            ]}
          />

          {(!isPC) && (
             <FeatureCard
              icon={Wallet}
              iconColor="text-rose-500"
              title="Keuangan (SIMPROKA Finance)"
              description="Ekosistem terpadu pencatatan arus kas, tagihan, dan budgeting."
              features={[
                { title: "Pendapatan (Uang Masuk)", desc: "Buat Invoice Termin ke Klien (bisa upload PDF) atau klik Catat Masuk untuk pemasukan tunai." },
                { title: "Pengeluaran (Uang Keluar)", desc: "Catat langsung Biaya Operasional / Material atau bayar Hutang Pemasok/Vendor." },
                { title: "RAB & Budgeting", desc: "Atur plafon anggaran di tiap proyek berdasarkan kategori agar pengeluaran terkontrol maksimal." },
                { title: "Laporan Keuangan", desc: "Lihat Laba Rugi Komprehensif dan Buku / Arus Kas secara otomatis per proyek atau konsolidasi." }
              ]}
            />
          )}

          {isAdmin && (
            <FeatureCard
              icon={Users}
              iconColor="text-amber-500"
              title="Kelola Pengguna (Admin Only)"
              description="Pengaturan akses dan manajemen tim SIMPROKA."
              features={[
                { title: "Registrasi Akun", desc: "Daftarkan manajer atau koordinator baru menggunakan email (minimal password 6 karakter)." },
                { title: "Penentuan Level (Role)", desc: "Ubah peran staf secara instan (Admin / Manager / PC)." },
                { title: "Hapus Akses", desc: "Hapus akun bagi rekan yang sudah keluar atau selesai masa kontrak." },
              ]}
            />
          )}

        </section>

        {/* Support Banner */}
        <div className="bg-indigo-50 p-6 md:p-8 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 text-lg">Butuh Bantuan Lain?</h3>
              <p className="text-indigo-700 mt-1 text-sm md:text-base">Jika Anda menemui kendala teknis atau memiliki pertanyaan lanjutan, hubungi Super Admin Anda.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Komponen Pembantu
function RoleCard({ title, color, items }: { title: string, color: 'purple' | 'blue' | 'emerald', items: string[] }) {
  const colors = {
    purple: 'bg-purple-50 border-purple-100 text-purple-800 marker-purple',
    blue: 'bg-blue-50 border-blue-100 text-blue-800 marker-blue',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800 marker-emerald',
  };

  const badgeColors = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className={clsx("p-5 rounded-xl border flex flex-col h-full transition hover:shadow-md", colors[color])}>
      <div className="mb-4">
        <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider mb-2", badgeColors[color])}>ROLE</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <ul className="space-y-2 mt-auto">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start text-sm">
            <CheckCircle className="min-w-4 w-4 h-4 mr-2 mt-0.5 shrink-0 opacity-70" />
            <span className="opacity-90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ icon: Icon, iconColor, title, description, features }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 transition hover:shadow-md h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className={clsx("p-3 rounded-xl bg-gray-50 border border-gray-100 shrink-0", iconColor)}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex-grow">
        <ul className="space-y-3">
          {features.map((f: any, i: number) => (
            <li key={i} className="flex items-start text-sm">
              <div className="mt-1 mr-3 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <div>
                <span className="font-semibold text-gray-700 block md:inline">{f.title}: </span>
                <span className="text-gray-600 block md:inline">{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
