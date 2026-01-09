import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Package, CheckCircle, Clock, BarChart3, Store, ArrowUpRight } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import { showError } from '../../utils/swal';

interface Statistics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  average_order_value: number;
}

interface RestaurantStats {
  restaurant_id: number;
  restaurant_name: string;
  total_orders: number;
  total_revenue: number;
}

export const SalesStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    fetchRestaurantStats();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await orderAPI.getSalesStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      await showError('Gagal Memuat Data', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurantStats = async () => {
    try {
      const response = await orderAPI.getRestaurantSales();
      if (response.status === 'success') {
        setRestaurantStats(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch restaurant stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat statistik...</p>
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
            <BarChart3 className="w-10 h-10 text-orange-600" />
            Sales Statistics
          </h1>
          <p className="text-gray-600">Analitik penjualan dan performa restoran (Real-time SOA)</p>
        </motion.div>

        {/* Overall Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Total Orders</span>
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.total_orders || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm font-medium">Total Revenue</span>
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{formatRupiah(statistics.total_revenue || 0)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-100 text-sm font-medium">Completed</span>
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.completed_orders || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-100 text-sm font-medium">Pending</span>
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.pending_orders || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 text-sm font-medium">Avg Order</span>
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-xl font-bold">{formatRupiah(statistics.average_order_value || 0)}</p>
            </motion.div>
          </div>
        )}

        {/* Restaurant Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Restaurant Performance</h2>
                <p className="text-sm text-orange-100 mt-1">Performa penjualan per restoran</p>
              </div>
            </div>
          </div>
          
          {restaurantStats.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data restoran</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Restoran</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restaurantStats.map((stat, index) => (
                    <motion.tr
                      key={stat.restaurant_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-orange-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-900">{stat.restaurant_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-900">{stat.total_orders || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-gray-900">{formatRupiah(stat.total_revenue || 0)}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
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
