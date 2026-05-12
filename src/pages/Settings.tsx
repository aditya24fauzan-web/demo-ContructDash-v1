import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Settings as SettingsIcon, Building, CreditCard, Users, Shield, Copy, Check, User, Activity } from 'lucide-react';
import clsx from 'clsx';
import { db, AuditLog } from '../lib/db';
import { doc, getDoc, setDoc, query, collection, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export function Settings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'billing' | 'audit'>('profile');
  const [copied, setCopied] = useState(false);

  const [companyName, setCompanyName] = useState('Perusahaan Saya');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [userName, setUserName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const { updatePassword } = useAuth();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (profile?.name) {
      setUserName(profile.name);
    }
  }, [profile?.name]);

  useEffect(() => {
    if (profile?.tenantId && profile.role === 'admin') {
      getDoc(doc(db, 'tenants', profile.tenantId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) setCompanyName(data.name);
          if (data.address) setCompanyAddress(data.address);
          if (data.phone) setCompanyPhone(data.phone);
          if (data.email) setCompanyEmail(data.email);
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.tenantId && profile.role === 'admin' && activeTab === 'audit') {
      const q = query(
        collection(db, 'auditLogs'), 
        where('tenantId', '==', profile.tenantId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setAuditLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      });
      return () => unsub();
    }
  }, [profile, activeTab]);

  const handleCopy = () => {
    if (!profile?.tenantId) return;
    navigator.clipboard.writeText(profile.tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenantId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await setDoc(doc(db, 'tenants', profile.tenantId), {
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSaveMessage({ type: 'success', text: 'Berhasil menyimpan profil perusahaan.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: 'error', text: 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        name: userName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSaveMessage({ type: 'success', text: 'Berhasil menyimpan profil Anda.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: 'error', text: 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Password konfirmasi tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password harus minimal 6 karakter.' });
      return;
    }
    
    setSavingSecurity(true);
    setSecurityMessage(null);
    try {
      await updatePassword(newPassword);
      setSecurityMessage({ type: 'success', text: 'Berhasil mengubah password.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecurityMessage(null), 3000);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
         setSecurityMessage({ type: 'error', text: 'Silakan logout dan login kembali untuk mengubah password.' });
      } else {
         setSecurityMessage({ type: 'error', text: `Gagal mengubah password: ${error.message}` });
      }
    } finally {
      setSavingSecurity(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl shadow-inner">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan</h1>
          <p className="text-sm text-gray-500">Kelola profil, perusahaan, dan aktivitas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap", activeTab === 'profile' ? "bg-white shadow-sm border border-gray-200 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}
          >
            <User size={18} /> Profil Saya
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap", activeTab === 'security' ? "bg-white shadow-sm border border-gray-200 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}
          >
            <Shield size={18} /> Keamanan
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('company')}
                className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap", activeTab === 'company' ? "bg-white shadow-sm border border-gray-200 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}
              >
                <Building size={18} /> Profil Perusahaan
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap", activeTab === 'billing' ? "bg-white shadow-sm border border-gray-200 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}
              >
                <CreditCard size={18} /> Langganan & Tagihan
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap", activeTab === 'audit' ? "bg-white shadow-sm border border-gray-200 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100")}
              >
                <Activity size={18} /> Log Aktivitas
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><User size={20} className="text-gray-400" /> Profil Saya</h2>
              
              <div className="max-w-xl space-y-6">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read Only)</label>
                     <input 
                       type="text" 
                       value={profile?.email || ''}
                       disabled
                       className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl focus:outline-none"
                     />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button disabled={saving} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                  
                  {saveMessage && (
                    <div className={clsx("p-3 rounded-lg text-sm", saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {saveMessage.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Shield size={20} className="text-gray-400" /> Keamanan & Kata Sandi</h2>
              
              <div className="max-w-xl space-y-6">
                <form onSubmit={handleSaveSecurity} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button disabled={savingSecurity} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition disabled:opacity-50">
                    {savingSecurity ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                  </button>
                  
                  {securityMessage && (
                    <div className={clsx("p-3 rounded-lg text-sm", securityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {securityMessage.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'company' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Building size={20} className="text-gray-400" /> Profil Perusahaan</h2>
              
              <div className="max-w-xl space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">ID Tenant Anda</p>
                    <p className="font-mono text-sm text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">{profile?.tenantId || '-'}</p>
                  </div>
                  <button onClick={handleCopy} className="text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition text-sm font-medium flex items-center gap-2">
                    {copied ? <Check size={16} /> : <Copy size={16} />} 
                    {copied ? 'Tersalin' : 'Salin ID'}
                  </button>
                </div>

                <form onSubmit={handleSaveCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan / Organisasi</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Perusahaan</label>
                    <textarea 
                      value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telepon Utama</label>
                      <input 
                        type="text" 
                        value={companyPhone}
                        onChange={e => setCompanyPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Perusahaan</label>
                      <input 
                        type="email" 
                        value={companyEmail}
                        onChange={e => setCompanyEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button disabled={saving} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan Perusahaan'}
                  </button>
                  
                  {saveMessage && (
                    <div className={clsx("p-3 rounded-lg text-sm", saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {saveMessage.text}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'billing' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><CreditCard size={20} className="text-gray-400" /> Paket Langganan</h2>
              
              <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl mb-8">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="inline-block px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-full text-xs font-bold uppercase tracking-wider mb-3">Paket Aktif</div>
                    <h3 className="text-3xl font-bold mb-1">Business Pro</h3>
                    <p className="text-indigo-200 text-sm">Rp 499.000 / bulan</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-indigo-200 mb-1">Siklus Tagihan Berikutnya</p>
                    <p className="text-lg font-semibold">14 Juni 2026</p>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-600" /> Kapasitas Pengguna</h4>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-gray-600">Terpakai 5 dari 15</span>
                    <span className="text-indigo-600">33%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '33%' }}></div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition">Upgrade Kapasitas →</button>
                </div>

                <div className="border border-gray-100 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-indigo-600" /> Metode Pembayaran</h4>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                      <span className="font-bold text-blue-800 text-xs italic">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">•••• •••• •••• 4242</p>
                      <p className="text-xs text-gray-500">Kadaluarsa: 12/28</p>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition">Kelola Pembayaran →</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Activity size={20} className="text-gray-400" /> Log Aktivitas Sistem (50 Terakhir)</h2>
               
               {auditLogs.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                   Belum ada aktivitas terekam.
                 </div>
               ) : (
                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {auditLogs.map(log => (
                        <li key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-gray-900 text-sm">{log.userName}</span>
                               <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{log.action}</span>
                             </div>
                             <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{log.details}</p>
                          <div className="mt-1 text-xs text-gray-400 flex gap-2">
                            <span>Entity: {log.entity}</span>
                            {log.entityId && <span>ID: {log.entityId}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
