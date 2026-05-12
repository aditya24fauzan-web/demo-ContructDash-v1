import React from 'react';
import { LegalLayout } from '../components/LegalLayout';

export function CookiePolicy() {
  const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <LegalLayout title="Kebijakan Cookie" lastUpdated={lastUpdated}>
      <section>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Kebijakan Cookie ini menjelaskan bagaimana SIPO menggunakan cookie dan teknologi serupa untuk mengenali Anda saat Anda mengunjungi aplikasi dan situs web kami.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Apa itu Cookie?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Cookie adalah berkas data kecil yang ditempatkan di komputer atau perangkat seluler Anda saat mengunjungi web. Cookie digunakan secara luas oleh pembuat situs web dan aplikasi agar layanan dapat bekerja, bekerja lebih efisien, dan juga memberikan informasi pelaporan bagi pemilik aplikasi.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Mengapa Kami Menggunakan Cookie?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Kami menggunakan cookie karena beberapa alasan, yang utamanya agar SIPO dapat berfungsi dengan baik:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6 marker:text-blue-500">
          <li><strong className="text-gray-900 dark:text-white">Cookie Esensial:</strong> Sangat diperlukan agar fungsi dasar SIPO bekerja. Misalnya, menjaga sesi user saat melakukan log in maupun proses autentikasi. Tanpa ini layanan tidak bisa berjalan.</li>
          <li><strong className="text-gray-900 dark:text-white">Cookie Preferensi:</strong> Mengingat pengaturan yang Anda terapkan (contoh: mode gelap atau mode terang) sehingga pengalaman Anda selalu personal.</li>
          <li><strong className="text-gray-900 dark:text-white">Cookie Analitik:</strong> Membantu kami mengumpulkan ukuran interaksi di SIPO sehingga kami mengerti bagian aplikasi mana yang performanya harus kami tingkatkan.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Cookie Pihak Ketiga</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Selain cookie dari kami sendiri, platform aplikasi SIPO dapat menggunakan cookie dari pihak ketiga atau teknologi lokal standar lainnya dalam rangka menjaga ketersediaan layanan integrasi (contoh: Firebase Authentication). 
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Bagaimana Cara Mengontrol Cookie?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Anda memiliki hak untuk memutuskan apakah akan menerima atau menolak cookie. Sebagian besar browser web secara otomatis menerima cookie, namun Anda biasanya dapat mengubah setelan browser Anda untuk menolaknya jika Anda lebih suka seperti itu. Tentu saja, mematikan cookie esensial dapat mengakibatkan ketidakmampuan untuk login ke SIPO.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Perubahan pada Kebijakan</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          Kami dapat memperbarui Kebijakan Cookie ini sewaktu-waktu sebagai wujud refleksi fitur kami. Untuk informasi lebih lanjut, harap membaca ulang laman ini jika Anda memiliki kekhawatiran.
        </p>
      </section>
    </LegalLayout>
  );
}
