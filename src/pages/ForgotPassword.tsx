import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
         setError('Email ini belum terdaftar.');
      } else {
         setError(`Gagal mengirim email reset: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform hover:rotate-3 duration-300">
            <KeyRound className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
          Lupa Kata Sandi
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          Masukkan email Anda untuk kami kirimkan link reset kata sandi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Email Terkirim</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Silakan periksa kotak masuk {email} untuk instruksi reset password.</p>
              </div>
              <div className="mt-6">
                <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Kembali ke Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                    placeholder="Email terdaftar"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Kirim Link Reset'
                )}
              </button>
            </form>
          )}
        </div>
        
        <div className="flex justify-center mt-8">
          <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm font-medium text-gray-600 hover:text-gray-900 shadow-sm border border-gray-200/50 backdrop-blur-sm transition-all hover:shadow-md">
            <ArrowLeft size={16} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
