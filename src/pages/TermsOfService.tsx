import React from 'react';
import { LegalLayout } from '../components/LegalLayout';

export function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <LegalLayout title="Ketentuan Layanan" lastUpdated={lastUpdated}>
      <section>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Selamat datang di SIPO (Sistem Informasi Proyek dan Operasional). Dengan menggunakan layanan kami, Anda menyetujui ketentuan layanan berikut. Harap baca dengan saksama sebelum menggunakan aplikasi kami.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Penerimaan Ketentuan</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Dengan mengakses dan menggunakan platform SIPO, Anda setuju untuk terikat oleh Ketentuan Layanan ini, semua hukum yang berlaku, dan bertanggung jawab atas kepatuhan terhadap hukum setempat yang berlaku.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Penggunaan Lisensi</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Setiap pengguna diberikan lisensi terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk mengakses dan menggunakan SIPO sesuai dengan paket yang dipilih. Anda tidak diperbolehkan untuk:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 marker:text-blue-500">
          <li>Memodifikasi, menyalin, atau membongkar kode sumber dari layanan SIPO.</li>
          <li>Menggunakan layanan untuk tujuan ilegal atau tidak sah.</li>
          <li>Mendistribusikan ulang atau menjual kembali akses ke layanan SIPO tanpa izin tertulis.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Akun Pengguna</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan akun Anda, serta bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun Anda. SIPO tidak bertanggung jawab atas kerugian apa pun yang timbul akibat kegagalan Anda menjaga keamanan akun Anda.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Privasi dan Data</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Penggunaan Anda atas layanan kami juga tunduk pada Kebijakan Privasi kami. Dengan menggunakan SIPO, Anda mengizinkan pengumpulan dan penggunaan informasi sebagaimana diuraikan dalam Kebijakan Privasi.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Batasan Tanggung Jawab</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          SIPO disediakan "sebagaimana adanya". Kami tidak memberikan jaminan bahwa layanan akan selalu bebas dari gangguan atau kesalahan. Kami tidak bertanggung jawab atas kerusakan langsung, tidak langsung, insidental, atau konsekuensial yang diakibatkan oleh penggunaan layanan.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Perubahan Layanan dan Harga</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Kami berhak sewaktu-waktu dan dari waktu ke waktu untuk mengubah atau menghentikan, sementara atau permanen, layanan (atau bagiannya) dengan atau tanpa pemberitahuan. Harga semua layanan dapat berubah sewaktu-waktu.
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 p-6 sm:p-8 rounded-2xl border border-blue-100 dark:border-blue-900/50 mt-12">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">7. Hubungi Kami</h2>
        <p className="text-blue-800 dark:text-blue-200">
          Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, silakan hubungi kami di <a href="mailto:support@siposaas.com" className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-300 transition-colors">support@siposaas.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
