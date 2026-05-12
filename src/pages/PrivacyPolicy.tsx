import React from 'react';
import { LegalLayout } from '../components/LegalLayout';

export function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <LegalLayout title="Kebijakan Privasi" lastUpdated={lastUpdated}>
      <section>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Privasi Anda sangat penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana SIPO mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan aplikasi kami.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Informasi yang Kami Kumpulkan</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Kami mengumpulkan beberapa jenis informasi untuk menyediakan dan meningkatkan layanan kami:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 marker:text-blue-500">
          <li><strong className="text-gray-900 dark:text-white">Informasi Identitas Pribadi:</strong> Nama, alamat email, dan nomor telepon saat Anda mendaftar.</li>
          <li><strong className="text-gray-900 dark:text-white">Data Operasional:</strong> Proyek, tugas, laporan keuangan, dan data terkait proyek yang Anda masukkan ke dalam sistem.</li>
          <li><strong className="text-gray-900 dark:text-white">Data Penggunaan:</strong> Informasi tentang bagaimana Anda berinteraksi dengan aplikasi kami (log aktivitas, perangkat yang digunakan, alamat IP).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Cara Kami Menggunakan Informasi</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Informasi yang dikumpulkan digunakan untuk:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 marker:text-blue-500">
          <li>Menyediakan, memelihara, dan meningkatkan kualitas aplikasi SIPO.</li>
          <li>Mengelola akun pengguna Anda (autentikasi dan identifikasi).</li>
          <li>Menyediakan dukungan pelanggan terkait kendala yang Anda hadapi.</li>
          <li>Mengirimkan pemberitahuan penting terkait perubahan layanan atau kebijakan.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Perlindungan dan Isolasi Data</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Kami memperlakukan keamanan data dengan serius. Data Anda disimpan dalam infrastruktur database dengan tingkat keamanan tinggi. Kami menggunakan arsitektur multi-tenancy yang memastikan bahwa data organisasi Anda terisolasi secara ketat dari organisasi atau pelanggan lain.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Berbagi Data dengan Pihak Ketiga</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          SIPO <strong className="text-gray-900 dark:text-white">tidak akan</strong> menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami hanya dapat membagikan data kepada pihak ketiga dalam kondisi:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 marker:text-blue-500">
          <li>Untuk memenuhi kewajiban hukum atau permintaan otoritas berwenang.</li>
          <li>Penyedia layanan cloud infrastructure yang terikat perjanjian kerahasiaan untuk menjalankan fungsionalitas platform.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Hak Pengguna</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda kapan saja melalui antarmuka pengaturan di aplikasi SIPO. Anda juga dapat meminta penghapusan permanen dari sistem kami.
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 p-6 sm:p-8 rounded-2xl border border-blue-100 dark:border-blue-900/50 mt-12">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">6. Hubungi Kami</h2>
        <p className="text-blue-800 dark:text-blue-200">
          Jika ada pertanyaan atau kekhawatiran terkait privasi data Anda, jadwalkan diskusi lebih lanjut dengan kami melalui <a href="mailto:privacy@siposaas.com" className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-300 transition-colors">privacy@siposaas.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
