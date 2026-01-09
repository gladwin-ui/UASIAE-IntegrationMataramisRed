import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, DollarSign, CheckCircle, Clock, TrendingUp, BarChart3, Truck, Wallet, ArrowRight } from 'lucide-react';
import { orderAPI } from '../services/api';
import { formatRupiah } from '../utils/format';

interface Statistics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  average_order_value: number;
}

export const AdminDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await orderAPI.getSalesStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="w-full lg:pl-64">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-orange-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Analitik dan ringkasan penjualan sistem</p>
        </motion.div>

        {/* Analytics Overview */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-100 text-sm font-medium">Total Orders</span>
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.total_orders || 0}</p>
              <Link to="/admin/statistics" className="text-orange-100 text-xs mt-2 hover:underline inline-flex items-center gap-1">
                Lihat detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm font-medium">Total Revenue</span>
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{formatRupiah(statistics.total_revenue || 0)}</p>
              <Link to="/admin/statistics" className="text-green-100 text-xs mt-2 hover:underline inline-flex items-center gap-1">
                Lihat detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Completed</span>
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.completed_orders || 0}</p>
              <Link to="/admin/orders" className="text-blue-100 text-xs mt-2 hover:underline inline-flex items-center gap-1">
                Lihat detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-100 text-sm font-medium">Pending</span>
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{statistics.pending_orders || 0}</p>
              <Link to="/admin/orders" className="text-yellow-100 text-xs mt-2 hover:underline inline-flex items-center gap-1">
                Lihat detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 text-sm font-medium">Avg Order</span>
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-xl font-bold">{formatRupiah(statistics.average_order_value || 0)}</p>
              <Link to="/admin/statistics" className="text-purple-100 text-xs mt-2 hover:underline inline-flex items-center gap-1">
                Lihat detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Link
            to="/admin/statistics"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 border-orange-500 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Sales Statistics</p>
                <p className="text-sm text-gray-600">Lihat analitik penjualan</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 border-blue-500 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Track Orders</p>
                <p className="text-sm text-gray-600">Kelola pesanan</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/drivers"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 border-green-500 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Track Drivers</p>
                <p className="text-sm text-gray-600">Pantau driver</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/admin/salaries"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4 border-yellow-500 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <Wallet className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Driver Salaries</p>
                <p className="text-sm text-gray-600">Kelola gaji driver</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </motion.div>

        {/* Additional Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Link
            to="/admin/restaurants"
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Manage Restaurants</h3>
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </div>
            <p className="text-orange-100 mb-4">Kelola restoran dan menu makanan</p>
            <div className="flex items-center gap-2 text-orange-100 text-sm font-medium">
              <span>Kelola sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Manage Users</h3>
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </div>
            <p className="text-blue-100 mb-4">Kelola pengguna dan alamat</p>
            <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
              <span>Kelola sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>
        </div>
      </div>
    </div>
  );
};
