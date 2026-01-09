import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle, Truck, ChefHat, Search, Filter, Calendar, MapPin, User, Mail } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import { generateOrderCode } from '../../utils/orderCode';
import { showError } from '../../utils/swal';

interface Order {
  order_id: number;
  restaurant_name: string;
  customer_name: string;
  customer_email: string;
  driver_id: number | null;
  driver_name: string | null;
  driver_email: string | null;
  status: string;
  total_price: number;
  estimated_delivery_time: string | null;
  created_at: string;
}

const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { label: string; color: string; bgColor: string; icon: React.ReactNode } } = {
    DELIVERED: {
      label: 'Selesai',
      color: 'text-green-800',
      bgColor: 'bg-green-100 border-green-300',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    ON_THE_WAY: {
      label: 'Dalam Perjalanan',
      color: 'text-purple-800',
      bgColor: 'bg-purple-100 border-purple-300',
      icon: <Truck className="w-4 h-4" />,
    },
    PREPARING: {
      label: 'Sedang Disiapkan',
      color: 'text-orange-800',
      bgColor: 'bg-orange-100 border-orange-300',
      icon: <ChefHat className="w-4 h-4" />,
    },
  };
  return configs[status] || {
    label: status,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: <Package className="w-4 h-4" />,
  };
};

export const TrackOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderAPI.getAllOrders();
      if (response.status === 'success') {
        setOrders(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      await showError('Gagal Memuat Data', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      order.order_id.toString().includes(searchQuery) ||
      order.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.driver_name && order.driver_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statusOptions = [
    { value: 'All', label: 'Semua Status' },
    { value: 'DELIVERED', label: 'Selesai' },
    { value: 'ON_THE_WAY', label: 'Dalam Perjalanan' },
    { value: 'PREPARING', label: 'Sedang Disiapkan' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat data pesanan...</p>
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
            <Package className="w-10 h-10 text-orange-600" />
            Track Orders
          </h1>
          <p className="text-gray-600">Pantau semua pesanan dalam sistem (Real-time SOA)</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan ID, restoran, customer, atau driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <h2 className="text-xl font-bold">Daftar Pesanan</h2>
            <p className="text-sm text-orange-100 mt-1">Total: {filteredOrders.length} pesanan</p>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada pesanan ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kode Pesanan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Restoran</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <motion.tr
                        key={order.order_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">{generateOrderCode(order.order_id)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-900">{order.restaurant_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.customer_name}
                            </div>
                            <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {order.customer_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.driver_name ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <Truck className="w-3 h-3 text-purple-500" />
                                {order.driver_name}
                              </div>
                              <div className="text-gray-500 text-xs">{order.driver_email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Belum ditugaskan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${statusConfig.bgColor} ${statusConfig.color}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-orange-600">{formatRupiah(order.total_price)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
};
