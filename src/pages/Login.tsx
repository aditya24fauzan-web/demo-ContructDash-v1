import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { HardHat, Shield, Users, ClipboardList, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Login() {
  const { signIn, signInWithEmail } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignInGoogle = async () => {
    setIsLoggingIn(true);
    await signIn();
    setIsLoggingIn(false);
  };

  const handleSignInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      alert(`Gagal login: Email atau password salah, atau akun belum terdaftar.`);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
            <HardHat className="text-white w-10 h-10 transform translate-y-[-2px] translate-x-[2px]" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
          SIPO Desktop
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          Masuk ke akun Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <div>
            <button
              onClick={handleSignInGoogle}
              disabled={isLoggingIn}
              className="w-full mb-8 flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Lanjutkan dengan Google
                </>
              )}
            </button>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">Atau gunakan email</span>
              </div>
            </div>

            <form onSubmit={handleSignInEmail} className="space-y-4">
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
                    placeholder="Email"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                    placeholder="Password"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Lupa password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Login Sekarang'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              Belum punya akun? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">Daftar sekarang</Link>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm font-medium text-gray-600 hover:text-gray-900 shadow-sm border border-gray-200/50 backdrop-blur-sm transition-all hover:shadow-md">
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
