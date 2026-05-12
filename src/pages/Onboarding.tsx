import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useTenant } from '../lib/tenant';
import { Package, ArrowRight, Building2, Phone, Mail, MapPin } from 'lucide-react';

export function Onboarding() {
  const { user, profile } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    email: tenant?.email || profile?.email || '',
    phone: tenant?.phone || '',
    address: tenant?.address || ''
  });

  // If no user, to login. If onboarded or not the primary owner of the current tenant, to dashboard.
  if (!user) return <Navigate to="/login" />;
  if (profile?.isOnboarded || (profile && (profile.role !== 'owner' || profile.tenantId !== profile.uid))) {
    return <Navigate to={profile?.role === 'pc' ? "/reports" : "/dashboard"} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !tenant) return;
    setLoading(true);

    try {
      console.log("Updating tenant...");
      // 1. Update Tenant Info (Handle missing document from legacy users)
      const tenantRef = doc(db, 'tenants', profile.tenantId);
      const tenantSnap = await getDoc(tenantRef);
      
      try {
        if (tenantSnap.exists()) {
          console.log("Tenant exists, updating...");
          await updateDoc(tenantRef, {
            id: profile.tenantId,
            ownerId: profile.uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            createdAt: tenantSnap.data().createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else {
          console.log("Tenant does not exist, creating...");
          await setDoc(tenantRef, {
            id: profile.tenantId,
            name: formData.name || profile.name || 'Perusahaan Saya',
            email: formData.email || profile.email || '',
            phone: formData.phone || '',
            address: formData.address || '',
            ownerId: profile.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch(e: any) {
        throw new Error("Tenant operation failed: " + e.message);
      }

      console.log("Updating user profile...");
      try {
        // 2. Set profile isOnboarded to true
        await setDoc(doc(db, 'users', profile.uid), {
          uid: profile.uid,
          name: profile.name || 'Unknown User',
          email: profile.email || '',
          role: profile.role || 'owner',
          createdAt: profile.createdAt || new Date().toISOString(),
          tenantId: profile.tenantId || profile.uid,
          isOnboarded: true
        }, { merge: true });
      } catch(e: any) {
        throw new Error("User operation failed: " + e.message);
      }
      console.log("Onboarding complete.");

      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error during onboarding:", error);
      console.error('Error during onboarding:', error);
      alert('Gagal menyimpan profil perusahaan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Atur Profil Perusahaan
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Satu langkah lagi untuk mulai mengelola proyek Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleComplete} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Perusahaan / Workspace
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="PT Konstruksi Jaya"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Perusahaan
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="info@perusahaan.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Nomor Telepon
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="021-12345678"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Alamat
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="Jl. Sudirman No 1..."
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (
                  <>
                    Simpan dan Lanjutkan <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
