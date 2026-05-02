import React, { useState } from 'react';
import { useAuth, Role } from '../lib/auth';
import { HardHat, Shield, Users, ClipboardList, Mail, Lock } from 'lucide-react';

export function Login() {
  const { signIn, signInWithEmail } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('pc');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignInGoogle = async () => {
    setIsLoggingIn(true);
    await signIn(selectedRole);
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <HardHat className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ConstructDash
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Silakan pilih role Anda dan login untuk melanjutkan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Role Login:</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedRole('admin')}
                className={`flex items-center p-3 border rounded-lg ${selectedRole === 'admin' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Shield className="mr-3" size={20} />
                <div className="text-left">
                  <div className="font-medium">Admin</div>
                  <div className="text-xs opacity-80">Akses penuh ke semua fitur</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedRole('manager')}
                className={`flex items-center p-3 border rounded-lg ${selectedRole === 'manager' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Users className="mr-3" size={20} />
                <div className="text-left">
                  <div className="font-medium">Manager</div>
                  <div className="text-xs opacity-80">Monitor & approval laporan</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('pc')}
                className={`flex items-center p-3 border rounded-lg ${selectedRole === 'pc' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <ClipboardList className="mr-3" size={20} />
                <div className="text-left">
                  <div className="font-medium">Project Coordinator</div>
                  <div className="text-xs opacity-80">Input laporan harian proyek</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {selectedRole === 'pc' ? (
              <form onSubmit={handleSignInEmail} className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 text-center mb-4">Login dengan Akun Terdaftar</h3>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Email Coordinator"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Login Email'
                  )}
                </button>
              </form>
            ) : (
              <button
                onClick={handleSignInGoogle}
                disabled={isLoggingIn}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Lanjutkan dengan Google
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
