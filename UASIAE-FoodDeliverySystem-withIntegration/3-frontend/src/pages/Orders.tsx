import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChefHat, ArrowRight } from 'lucide-react';
import { orderAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';
import { generateOrderCode } from '../utils/orderCode';

interface Order {
  order_id: number;
  restaurant_name: string;
  status: string;
  total_price: number;
  created_at: string;
}

const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { label: string; color: string; bgColor: string; icon: React.ReactNode } } = {
    PENDING_PAYMENT: {
      label: 'Menunggu Pembayaran',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100 border-yellow-300',
      icon: <Clock className="w-4 h-4" />,
    },
    PAID: {
      label: 'Sudah Dibayar',
      color: 'text-blue-800',
      bgColor: 'bg-blue-100 border-blue-300',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    PREPARING: {
      label: 'Sedang Disiapkan',
      color: 'text-orange-800',
      bgColor: 'bg-orange-100 border-orange-300',
      icon: <ChefHat className="w-4 h-4" />,
    },
    ON_THE_WAY: {
      label: 'Dalam Perjalanan',
      color: 'text-purple-800',
      bgColor: 'bg-purple-100 border-purple-300',
      icon: <Package className="w-4 h-4" />,
    },
    DELIVERED: {
      label: 'Selesai',
      color: 'text-green-800',
      bgColor: 'bg-green-100 border-green-300',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    PAYMENT_FAILED: {
      label: 'Pembayaran Gagal',
      color: 'text-red-800',
      bgColor: 'bg-red-100 border-red-300',
      icon: <XCircle className="w-4 h-4" />,
    },
  };
  return configs[status] || {
    label: status,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: <AlertCircle className="w-4 h-4" />,
  };
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getOrders();
        if (response.status === 'success') {
          setOrders(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  /* ... inside Orders component ... */
  const handleCancel = async (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    try {
      await orderAPI.cancelOrder(orderId);
      // Refresh
      const response = await orderAPI.getOrders();
      if (response.status === 'success') {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert('Gagal membatalkan pesanan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Pesanan Saya</h1>
              <p className="text-gray-600">Lihat dan lacak semua pesanan Anda</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/browse')} className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Jelajahi Restoran
            </Button>
          </div>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray-600 mb-6">Mulai pesan makanan favoritmu sekarang!</p>
              <Button variant="primary" onClick={() => navigate('/browse')} size="lg">
                Mulai Pesan
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const isPending = order.status === 'PENDING_PAYMENT' || order.status === 'PENDING';

              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col justify-between"
                  onClick={() => navigate(`/orders/${order.order_id}`)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {generateOrderCode(order.order_id)}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <ChefHat className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">{order.restaurant_name}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Total</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatRupiah(order.total_price)}
                        </span>
                      </div>
                    </div>

                    {isPending ? (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payment/${order.order_id}`);
                          }}
                        >
                          Bayar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={(e) => handleCancel(e, order.order_id)}
                        >
                          Batalkan
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-orange-600 text-sm font-medium group-hover:gap-2 transition-all mt-4 pt-4 border-t border-gray-100">
                        <span>Lihat Detail</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div >
  );
};
