import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, DollarSign, CheckCircle, XCircle, Clock, User, Phone, Car, MapPin, Calendar, Wallet } from 'lucide-react';
import { driverAPI } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import { showError } from '../../utils/swal';

interface ActiveOrder {
  order_id: number;
  customer_name: string;
  restaurant_name: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface Driver {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: string;
  is_available: boolean;
  is_on_job: boolean;
  active_orders: number;
  active_orders_details?: ActiveOrder[];
  total_earnings: number;
  created_at: string;
}

export const TrackDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await driverAPI.getAllDrivers();
      if (response.status === 'success') {
        setDrivers(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
      await showError('Gagal Memuat Data', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Memuat data driver...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="w-full lg:pl-64">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Truck className="w-10 h-10 text-orange-600" />
              Track Drivers
            </h1>
            <p className="text-gray-600">Pantau status dan aktivitas semua driver (Real-time SOA)</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Total Drivers</span>
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{drivers.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm font-medium">Available</span>
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{drivers.filter(d => d.is_available && !d.is_on_job).length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-100 text-sm font-medium">On Job</span>
                <Package className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{drivers.filter(d => d.is_on_job || d.active_orders > 0).length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 text-sm font-medium">Total Earnings</span>
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-xl font-bold">{formatRupiah(drivers.reduce((sum, d) => sum + (d.total_earnings || 0), 0))}</p>
            </motion.div>
          </div>

          {/* Drivers Grid */}
          {drivers.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada driver ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver, index) => {
                // Logic Fix: Trust is_on_job. If on job, assume busy. 
                // Active Orders might be 0 in backend response if not implemented, 
                // but is_on_job is reliable from accept/complete flow.
                const isOnJob = driver.is_on_job;
                const isAvailable = driver.is_available && !isOnJob;

                return (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAvailable ? 'bg-green-100' : isOnJob ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                          <Truck className={`w-6 h-6 ${isAvailable ? 'text-green-600' : isOnJob ? 'text-orange-600' : 'text-gray-600'
                            }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{driver.name}</h3>
                          <p className="text-sm text-gray-500">ID: {driver.id}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isAvailable
                          ? 'bg-green-100 text-green-800'
                          : isOnJob
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {isAvailable ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Available
                          </>
                        ) : isOnJob ? (
                          <>
                            <Clock className="w-3 h-3" />
                            On Job
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Busy
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span>{driver.vehicle_type} - {driver.vehicle_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>Active Orders: {driver.active_orders}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-green-600">
                          Total Paid: {formatRupiah((driver as any).lifetime_earnings || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Wallet className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-blue-600">
                          Wallet: {formatRupiah(driver.total_earnings || 0)}
                        </span>
                      </div>
                    </div>

                    {driver.active_orders_details && driver.active_orders_details.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Active Orders:</p>
                        <div className="space-y-2">
                          {driver.active_orders_details.map((order) => (
                            <div key={order.order_id} className="p-2 bg-orange-50 rounded-lg text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">Order #{order.order_id}</span>
                                <span className="text-orange-600 font-semibold">{formatRupiah(order.total_price || 0)}</span>
                              </div>
                              <p className="text-gray-600">{order.restaurant_name}</p>
                              <p className="text-gray-600">Customer: {order.customer_name}</p>
                              <p className="text-gray-500 mt-1">Status: {order.status}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Bergabung: {new Date(driver.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
