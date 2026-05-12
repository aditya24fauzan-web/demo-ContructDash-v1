import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, setDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../lib/db';
import { secondaryAuth } from '../lib/firebase';
import { useAuth, UserProfile } from '../lib/auth';
import { ConfirmModal } from '../components/ConfirmModal';
import { Trash2, UserPlus, X } from 'lucide-react';

export function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'owner'|'admin'|'manager'|'pc'>('pc');
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if ((profile?.role !== 'admin' && profile?.role !== 'owner') || !profile?.tenantId) return;
    
    const unsub = onSnapshot(query(collection(db, 'users'), where('tenantId', '==', profile.tenantId)), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsub();
  }, [profile]);

  const handleRoleChange = async (uid: string, newRole: string) => {
    if (uid === profile?.uid) {
      alert("Anda tidak dapat mengubah role Anda sendiri.");
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Gagal mengupdate role");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus pengguna");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) return;
    
    setIsSubmitting(true);
    setCreateError(null);
    try {
      // Create user within Firebase secondary auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const uid = userCredential.user.uid;

      // Add to Firestore using the newly generated UID
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: newName,
        email: newEmail,
        role: newRole,
        tenantId: profile?.tenantId || '',
        createdAt: new Date().toISOString(),
        isOnboarded: true,
      });

      // Sign out from the secondary auth instance immediately
      await signOut(secondaryAuth);
      
      setIsModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('pc');
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === 'auth/email-already-in-use') {
        setCreateError('Gagal: Email ini sudah terdaftar di sistem. Silakan gunakan email lain.');
      } else {
        setCreateError(`Gagal membuat user: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return <div>Akses Ditolak. Halaman ini hanya untuk Admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <UserPlus size={20} />
          <span className="hidden sm:inline">Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                      disabled={user.uid === profile.uid}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="pc">Project Coordinator</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.uid !== profile.uid && (
                      <button
                        onClick={() => setDeleteConfirmId(user.uid)}
                        className="text-red-500 hover:text-red-700 ml-4"
                        title="Hapus Pengguna"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteUser(deleteConfirmId)}
        title="Hapus Pengguna"
        message="Yakin ingin menghapus pengguna ini? Pengguna akan kehilangan akses ke sistem."
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">Tambah Pengguna Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama pengguna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="pc">Project Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-500 font-normal">(Digunakan untuk login)</span></label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                  {createError}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
