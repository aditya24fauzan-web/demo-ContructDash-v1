import React from 'react';
import { ArrowRight, BarChart3, CheckCircle2, Package, PieChart, Users, Shield, Zap, Check, ChevronDown } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const faqs = [
  {
    question: 'Apakah aplikasi ini cocok untuk perusahaan kecil?',
    answer: 'Sangat cocok. SIPO dirancang agar fleksibel dan dapat digunakan mulai dari tim kecil hingga perusahaan skala besar dengan banyak proyek sekaligus.',
  },
  {
    question: 'Apakah data saya aman?',
    answer: 'Kami menggunakan standar enkripsi industri terdepan untuk database, sehingga data Anda terjamin kerahasiaannya. Setiap workspace (tenant) terisolasi sepenuhnya.',
  },
  {
    question: 'Apakah saya bisa membatalkan langganan kapan saja?',
    answer: 'Tentu saja. Tidak ada kontrak yang mengikat Anda panjang waktu. Anda bebas membatalkan kapan saja melalui dashboard pengaturan akun.',
  },
  {
    question: 'Apakah ada batasan jumlah user?',
    answer: 'Batasan user bergantung pada paket yang Anda pilih. Paket "Gratis" mendukung hingga 3 anggota tim, sementara "Pro" mendukung tim lebih besar.',
  },
];

export function LandingPage() {
  const { user } = useAuth();

  // If already logged in, skip landing page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
      <header className="fixed top-0 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SIPO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">Masuk</Link>
            <Link to="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Siap untuk Profesional
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
            Kelola Proyek & Keuangan <br className="hidden md:block"/> dalam Satu Platform
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            SIPO (Sistem Informasi Proyek dan Operasional) membantu bisnis Anda mengelola tugas, melacak inventaris,
            memantau arus kas, dan menghasilkan laporan komprehensif tanpa ribet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-105">
              Coba Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              Pelajari Fitur
            </a>
          </div>
          
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent z-10 hidden md:block" style={{ bottom: '-1px' }}></div>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2000&q=80" 
              alt="Dashboard Preview" 
              className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl mx-auto object-cover md:h-[600px] w-full"
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Solusi Lengkap untuk Bisnis</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Tinggalkan spreadsheet lama Anda. Beralih ke sistem modern yang terintegrasi penuh.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
                  title: "Manajemen Proyek",
                  desc: "Lacak progress, kelola tim, dan pastikan deadline tercapai tepat waktu dengan modul proyek kami."
                },
                {
                  icon: <PieChart className="w-6 h-6 text-emerald-600" />,
                  title: "Keuangan Terpusat",
                  desc: "Catat pemasukan, pengeluaran, invoices, dan lihat laporan cashflow secara real-time."
                },
                {
                  icon: <Users className="w-6 h-6 text-purple-600" />,
                  title: "Kolaborasi Tim",
                  desc: "Undang anggota tim dengan kontrol akses (role) yang dapat disesuaikan."
                },
                {
                  icon: <Package className="w-6 h-6 text-amber-600" />,
                  title: "Multi Tenant",
                  desc: "Satu akun untuk mengelola ruang kerja (workspace) independen dengan data yang terisolasi aman."
                },
                {
                  icon: <CheckCircle2 className="w-6 h-6 text-rose-600" />,
                  title: "Laporan Otomatis",
                  desc: "Generate laporan performa proyek dan keuangan hanya dalam satu klik."
                },
                {
                  icon: <Shield className="w-6 h-6 text-sky-600" />,
                  title: "Keamanan Enterprise",
                  desc: "Data Anda dienkripsi dan diamankan dengan standar infrastruktur global."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-gray-950 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4 bg-white dark:bg-gray-950">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Pilih Paket Sesuai Kebutuhan</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Mulai dengan gratis, tingkatkan saat bisnis Anda berkembang.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Gratis</h3>
                <p className="text-gray-500 text-sm mb-6">Cocok untuk tim kecil dan uji coba.</p>
                <div className="text-4xl font-bold mb-6">Rp 0 <span className="text-lg font-normal text-gray-500">/ bulan</span></div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {['Maksimal 3 proyek', 'Hingga 3 anggota tim', 'Laporan dasar', 'Penyimpanan 1GB'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-center rounded-xl font-medium transition-colors">
                  Mulai Gratis
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-blue-600 text-white p-8 rounded-3xl border border-blue-500 shadow-xl shadow-blue-600/20 flex flex-col relative transform md:-translate-y-4">
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Paling Populer
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Profesional</h3>
                <p className="text-blue-100 text-sm mb-6">Untuk bisnis menengah dan berkembang.</p>
                <div className="text-4xl font-bold mb-6">Rp 299k <span className="text-lg font-normal text-blue-200">/ bulan</span></div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {['Proyek tidak terbatas', 'Hingga 15 anggota tim', 'Laporan lengkap & export', 'Penyimpanan 50GB', 'Dukungan prioritas'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-blue-50">
                      <Check className="w-5 h-5 text-blue-200 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block w-full py-3 px-4 bg-white text-blue-600 hover:bg-gray-50 text-center rounded-xl font-medium transition-colors">
                  Coba Gratis 14 Hari
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-gray-500 text-sm mb-6">Solusi kustom untuk perusahaan besar.</p>
                <div className="text-4xl font-bold mb-6">Kustom</div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {['Anggota tim tidak terbatas', 'Fitur custom (SLA)', 'Integrasi API', 'Dedicated Account Manager', 'Penyimpanan kustom'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a href="mailto:contact@siposaas.com" className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-center rounded-xl font-medium transition-colors">
                  Hubungi Penjualan
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Pertanyaan Umum</h2>
              <p className="text-gray-600 dark:text-gray-400">Hal-hal yang sering ditanyakan oleh pelanggan kami.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-lg">
                    {faq.question}
                    <span className="transition group-open:rotate-180">
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </span>
                  </summary>
                  <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Zap className="w-12 h-12 text-blue-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold tracking-tight mb-6">Sederhanakan Operasional Anda Sekarang</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">Bergabunglah dan tingkatkan produktivitas bisnis Anda ke level berikutnya.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-105">
              Daftar Gratis <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-16 bg-white dark:bg-gray-950 text-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold tracking-tight">SIPO</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                Sistem Informasi Proyek dan Operasional terpadu. Cara termudah menyelesaikan lebih banyak hal dengan lebih sedikit kekacauan.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produk</h4>
              <ul className="space-y-3 text-gray-500 dark:text-gray-400">
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-blue-600 transition-colors">Harga</a></li>
                <li><a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Keamanan</a></li>
                <li><a href="#updates" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Pembaruan</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Perusahaan</h4>
              <ul className="space-y-3 text-gray-500 dark:text-gray-400">
                <li><a href="#about" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Tentang Kami</a></li>
                <li><a href="#careers" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Karir</a></li>
                <li><a href="#contact" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Kontak</a></li>
                <li><a href="#partners" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 transition-colors">Mitra</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-500 dark:text-gray-400">
                <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Ketentuan Layanan</Link></li>
                <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/cookies" className="hover:text-blue-600 transition-colors">Kebijakan Cookie</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© {new Date().getFullYear()} SIPO SaaS. All rights reserved.</p>
            <div className="flex gap-4 text-gray-400">
              <a href="#twitter" onClick={(e) => e.preventDefault()} className="hover:text-gray-600 dark:hover:text-gray-200">Twitter</a>
              <a href="#linkedin" onClick={(e) => e.preventDefault()} className="hover:text-gray-600 dark:hover:text-gray-200">LinkedIn</a>
              <a href="#instagram" onClick={(e) => e.preventDefault()} className="hover:text-gray-600 dark:hover:text-gray-200">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
