import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { AddressModal } from '../components/AddressModal';
import { showSuccess, showError, showConfirm } from '../utils/swal';

interface Address {
  id: number;
  label: string;
  full_address: string;
  is_default: boolean;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAddresses();
      if (response.status === 'success') {
        setAddresses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (addressData: {
    label: string;
    full_address: string;
    is_default: boolean;
  }) => {
    await userAPI.createAddress(addressData);
    await fetchAddresses();
  };

  const handleUpdateAddress = async (addressData: {
    label: string;
    full_address: string;
    is_default: boolean;
  }) => {
    if (!editingAddress) return;
    await userAPI.updateAddress(editingAddress.id, addressData);
    await fetchAddresses();
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (id: number) => {
    const result = await showConfirm(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini?',
      'Ya, Hapus',
      'Batal'
    );

    if (result.isConfirmed) {
      try {
        await userAPI.deleteAddress(id);
        await showSuccess('Alamat Berhasil Dihapus! ✅');
        await fetchAddresses();
      } catch (error: any) {
        await showError('Gagal Menghapus Alamat', error.response?.data?.message || 'Terjadi kesalahan');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Kelola informasi dan alamat pengiriman Anda</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">
                    {user?.name?.charAt(0).toUpperCase() || '👤'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nama</label>
                  <p className="text-gray-900 font-medium">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
                {user?.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telepon</label>
                    <p className="text-gray-900 font-medium">{user.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-900 font-medium capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Addresses Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Alamat Pengiriman</h2>
                  <p className="text-gray-600 text-sm mt-1">Kelola alamat untuk pengiriman pesanan</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setShowAddAddress(true)}
                  className="flex items-center gap-2"
                >
                  <span>➕</span> Tambah Alamat
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📍</div>
                  <p className="text-gray-600 mb-4">Belum ada alamat tersimpan</p>
                  <Button variant="primary" onClick={() => setShowAddAddress(true)}>
                    Tambah Alamat Pertama
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <motion.div
                      key={address.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative"
                    >
                      <span className={`absolute top-2 right-2 px-2 py-1 text-white text-xs font-semibold rounded-full ${
                        address.is_default ? 'bg-orange-500' : 'bg-gray-400'
                      }`}>
                        {address.is_default ? 'Default' : 'Tidak Default'}
                      </span>
                      <h3 className="font-semibold text-gray-900 mb-2">{address.label}</h3>
                      <p className="text-gray-600 text-sm mb-4">{address.full_address}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAddress(address)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          Hapus
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AddressModal
        isOpen={showAddAddress}
        onClose={() => setShowAddAddress(false)}
        onSuccess={fetchAddresses}
        onSubmit={handleAddAddress}
        mode="add"
      />

      {/* Edit Address Modal */}
      {editingAddress && (
        <AddressModal
          isOpen={!!editingAddress}
          onClose={() => setEditingAddress(null)}
          onSuccess={fetchAddresses}
          onSubmit={handleUpdateAddress}
          initialData={editingAddress}
          mode="edit"
        />
      )}
    </div>
  );
};
