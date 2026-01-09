import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, User, Mail, CheckCircle, Clock, XCircle, Wallet, TrendingUp } from 'lucide-react';
import { driverAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { formatRupiah } from '../../utils/format';
import { showSuccess, showError, showConfirm } from '../../utils/swal';

interface Salary {
  id: number;
  driver_id: number;
  driver_name?: string;
  driver_email?: string;
  total_earnings?: number;
  status: string;
  created_at: string;
}

interface Driver {
  id: number;
  name: string;
  email: string;
  total_earnings?: number;
  active_orders?: number;
}

export const DriverSalaries: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAsPaid, setMarkingAsPaid] = useState<number | null>(null);

  useEffect(() => {
    fetchSalaries();
    fetchDrivers();
    const interval = setInterval(() => {
      fetchSalaries();
      fetchDrivers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAllDrivers();
      if (response.status === 'success') {
        setDrivers(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      setIsLoading(true);
      const response = await driverAPI.getDriverSalaries();
      if (response.status === 'success') {
        setSalaries(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch salaries:', error);
      await showError('Gagal Memuat Data', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    const result = await showConfirm(
      'Tandai Sebagai Dibayar',
      `Apakah Anda yakin ingin menandai gaji untuk ${driver?.name || 'driver'} sebagai sudah dibayar? Total earnings akan direset ke 0.`,
      'Ya, Tandai Dibayar',
      'Batal'
    );

    if (!result.isConfirmed) {
      return;
    }

    setMarkingAsPaid(driverId);
    try {
      const response = await driverAPI.markDriverEarningsAsPaid(driverId);
      if (response.status === 'success') {
        await showSuccess('Gaji Berhasil Ditandai Dibayar!', `Gaji untuk ${driver?.name || 'driver'} telah ditandai sebagai dibayar.`);
        await fetchSalaries();
        await fetchDrivers();
      }
    } catch (error: any) {
      await showError('Gagal Menandai Gaji', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setMarkingAsPaid(null);
    }
  };

  const getTotalPendapatan = (driverId: number): number => {
    const driverSalaries = salaries.filter(s => s.driver_id === driverId);
    return driverSalaries.reduce((sum, salary) => {
      const earnings = typeof salary.total_earnings === 'number' 
        ? salary.total_earnings 
        : parseFloat(String(salary.total_earnings || 0));
      return sum + (isNaN(earnings) ? 0 : earnings);
    }, 0);
  };

  const totalUnpaid = drivers.reduce((sum, d) => sum + (d.total_earnings || 0), 0);
  const totalPaid = drivers.reduce((sum, d) => sum + getTotalPendapatan(d.id), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Memuat data gaji...</p>
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
            <Wallet className="w-10 h-10 text-orange-600" />
            Driver Salaries
          </h1>
          <p className="text-gray-600">Kelola gaji driver (Real-time SOA data)</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100 text-sm font-medium">Total Drivers</span>
              <User className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{drivers.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-100 text-sm font-medium">Unpaid Earnings</span>
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xl font-bold">{formatRupiah(totalUnpaid)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm font-medium">Total Paid</span>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xl font-bold">{formatRupiah(totalPaid)}</p>
          </motion.div>
        </div>

        {/* Salary Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Salary Records</h2>
                <p className="text-sm text-green-100 mt-1">Semua driver dengan informasi gaji (Real-time SOA)</p>
              </div>
            </div>
          </div>
          
          {drivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada driver ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Earnings (Unpaid)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Pendapatan (Paid)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map((driver, index) => {
                    const hasEarnings = driver.total_earnings && driver.total_earnings > 0;
                    const isMarking = markingAsPaid === driver.id;
                    const totalPendapatan = getTotalPendapatan(driver.id);

                    return (
                      <motion.tr
                        key={driver.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-green-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{driver.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {driver.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-bold text-green-600">{formatRupiah(driver.total_earnings || 0)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-bold text-blue-600">{formatRupiah(totalPendapatan)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasEarnings ? (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1.5 w-fit">
                              <Clock className="w-3 h-3" />
                              BELUM DIGAJI
                            </span>
                          ) : totalPendapatan > 0 ? (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1.5 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              PAID
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex items-center gap-1.5 w-fit">
                              <XCircle className="w-3 h-3" />
                              NO SALARY
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasEarnings ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkAsPaid(driver.id)}
                              disabled={isMarking}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isMarking ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Mark as Paid
                                </>
                              )}
                            </Button>
                          ) : totalPendapatan > 0 ? (
                            <span className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full flex items-center gap-1.5 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full flex items-center gap-1.5 w-fit">
                              <XCircle className="w-3 h-3" />
                              No Earnings
                            </span>
                          )}
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
