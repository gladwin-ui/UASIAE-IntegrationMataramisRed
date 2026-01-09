import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CheckCircle, ChefHat, Truck, MapPin, Clock, User, Phone, Car, FileText, XCircle } from 'lucide-react';
import { orderAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';
import { generateOrderCode } from '../utils/orderCode';

interface OrderStatus {
  order_id: number;
  status: string;
  restaurant_details: {
    name: string;
    address: string;
  };
  delivery_address: string;
  driver_details: {
    name: string;
    phone: string;
    vehicle?: string;
    vehicle_type?: string;
    vehicle_number?: string;
  } | null;
  items: Array<{
    menu_item_name?: string;
    name?: string;
    quantity: number;
    price: number;
  }>;
  total_price: number;
  estimated_delivery: string | null;
  created_at?: string;
}

const statusSteps = [
  { key: 'PENDING_PAYMENT', label: 'Pesanan Dibuat', icon: FileText, color: 'yellow' },
  { key: 'PAID', label: 'Pembayaran Berhasil', icon: CheckCircle, color: 'blue' },
  { key: 'PREPARING', label: 'Sedang Disiapkan', icon: ChefHat, color: 'orange' },
  { key: 'ON_THE_WAY', label: 'Dalam Perjalanan', icon: Truck, color: 'purple' },
  { key: 'DELIVERED', label: 'Selesai', icon: Package, color: 'green' },
];

const getStatusColor = (color: string) => {
  const colors: { [key: string]: string } = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
  };
  return colors[color] || 'bg-gray-500';
};

export const OrderStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderAPI.getOrderById(parseInt(id!));
        if (response.status === 'success') {
          setOrder(response.data);
          setError('');
        } else {
          setError('Gagal memuat detail pesanan');
        }
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        setError(error.response?.data?.message || 'Gagal memuat detail pesanan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusSteps.findIndex((step) => step.key === order.status);
    return index >= 0 ? index : 0;
  };

  if (order?.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Dibatalkan</h1>
          <p className="text-gray-600 mb-6">Pesanan #{order.order_id} telah dibatalkan.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Kembali ke Pesanan
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h3>
          <p className="text-gray-600 mb-6">Pesanan yang Anda cari tidak ditemukan</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Kembali ke Pesanan
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = statusSteps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pesanan
        </motion.button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{generateOrderCode(order.order_id)}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(order.created_at || new Date()).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusColor(currentStep.color)}`}
            >
              {currentStep.label}
            </span>
          </div>

          {/* Status Stepper */}
          <div className="mb-6">
            <div className="flex justify-between items-center relative py-4">
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 z-0">
                <motion.div
                  className={`h-full ${getStatusColor(currentStep.color)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: index === currentStepIndex ? 1.2 : 1,
                        backgroundColor: isActive ? getStatusColor(step.color).replace('bg-', '') : '#e5e7eb',
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-lg ${index === currentStepIndex ? 'ring-4 ring-orange-200' : ''
                        } ${isActive ? getStatusColor(step.color) : 'bg-gray-300'}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span
                      className={`text-xs font-medium text-center max-w-[90px] ${isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant & Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Pengiriman</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <ChefHat className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">Restoran</span>
                  </div>
                  <p className="text-gray-900 font-medium">{order.restaurant_details.name}</p>
                  <p className="text-gray-600 text-sm flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                    {order.restaurant_details.address}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Alamat Pengiriman</span>
                  </div>
                  <p className="text-gray-900 font-medium">{order.delivery_address}</p>
                </div>
              </div>

              {order.driver_details && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Truck className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">Driver</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nama</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {order.driver_details.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telepon</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {order.driver_details.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kendaraan</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        {order.driver_details.vehicle ||
                          [order.driver_details.vehicle_type, order.driver_details.vehicle_number]
                            .filter(Boolean)
                            .join(' - ') ||
                          '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {order.estimated_delivery && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Estimasi Pengiriman:</span>
                    <span className="text-gray-900">
                      {new Date(order.estimated_delivery).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detail Pesanan</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.menu_item_name || item.name}</p>
                      <p className="text-sm text-gray-600 mt-1">Jumlah: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="border-t-2 border-gray-200 mt-6 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatRupiah(order.total_price)}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Action Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Aksi (Sts: {order.status})</h3>
              <div className="space-y-3">
                {(order.status === 'PENDING_PAYMENT' || order.status === 'PENDING') && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/payment/${order.order_id}`)}
                      className="w-full justify-center bg-orange-600 hover:bg-orange-700"
                    >
                      Lanjut Pembayaran
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!window.confirm('Batalkan pesanan ini?')) return;
                        try {
                          await orderAPI.cancelOrder(order.order_id);
                          // Refresh logic: reload or navigate? 
                          // Best to reload to see updated status "Cancelled"
                          window.location.reload();
                        } catch (e) {
                          alert('Gagal membatalkan');
                        }
                      }}
                      className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Batalkan Pesanan
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/orders')}
                  className="w-full justify-center"
                >
                  Lihat Semua Pesanan
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/browse')}
                  className="w-full justify-center"
                >
                  Pesan Lagi
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
