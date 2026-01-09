import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Mail, Phone, MapPin, Calendar, Filter, Search, Shield, Truck, ShoppingBag } from 'lucide-react';
import { userAPI } from '../../services/api';
import { showError } from '../../utils/swal';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  addresses: Array<{
    id: number;
    label: string;
    full_address: string;
    is_default: boolean;
  }>;
  created_at: string;
}

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role.toUpperCase() === roleFilter.toUpperCase());
    }

    if (searchQuery) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery))
      );
    }

    setFilteredUsers(filtered);
  }, [roleFilter, searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAllUsers();
      if (response.status === 'success') {
        setUsers(response.data || []);
        setFilteredUsers(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      await showError('Gagal Memuat Data', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'DRIVER':
        return <Truck className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DRIVER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="w-full lg:pl-64">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-orange-500" />
              Manage Users
            </h1>
            <p className="text-gray-600">Kelola semua pengguna dalam sistem</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, email, atau telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${roleFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  All ({users.length})
                </button>
                <button
                  onClick={() => setRoleFilter('customer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${roleFilter === 'customer'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
                    }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Customer ({users.filter((u) => u.role.toUpperCase() === 'CUSTOMER').length})
                </button>
                <button
                  onClick={() => setRoleFilter('driver')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${roleFilter === 'driver'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                    }`}
                >
                  <Truck className="w-4 h-4" />
                  Driver ({users.filter((u) => u.role.toUpperCase() === 'DRIVER').length})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${roleFilter === 'admin'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin ({users.filter((u) => u.role.toUpperCase() === 'ADMIN').length})
                </button>
              </div>
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <h2 className="text-xl font-bold">Daftar Pengguna</h2>
              <p className="text-sm text-orange-100 mt-1">Total: {filteredUsers.length} pengguna</p>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-orange-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.phone ? (
                            <div className="text-sm text-gray-700 flex items-center gap-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phone}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${getRoleColor(user.role)}`}
                          >
                            {getRoleIcon(user.role)}
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.addresses && user.addresses.length > 0 ? (
                            <div className="text-sm text-gray-700 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-500" />
                              {user.addresses.length} alamat
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            }) : '-'}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* User Details Expandable */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-t border-orange-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Detail Pengguna: {selectedUser.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Phone:</span>
                      <span>{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      {getRoleIcon(selectedUser.role)}
                      <span className="font-medium">Role:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Addresses:</span>
                    </div>
                    {selectedUser.addresses && selectedUser.addresses.length === 0 ? (
                      <p className="text-gray-500 text-sm">No addresses</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedUser.addresses.map((addr) => (
                          <li key={addr.id} className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{addr.label}</span>
                              {addr.is_default && (
                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">Default</span>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">{addr.full_address}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
