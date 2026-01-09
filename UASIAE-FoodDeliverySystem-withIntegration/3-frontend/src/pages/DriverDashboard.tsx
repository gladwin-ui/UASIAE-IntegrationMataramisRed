import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Bell, User, MapPin, DollarSign, ShoppingBag, Phone, Car } from 'lucide-react';
import { driverAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';
import { showSuccess, showError, showConfirm } from '../utils/swal';

interface Order {
  order_id: number;
  restaurant_name: string;
  customer_name: string;
  customer_address: string;
  status: string;
  total_price: number;
  created_at: string;
  items: Array<{
    menu_item_name: string;
    quantity: number;
    price: number;
  }>;
}

const statusColors: { [key: string]: string } = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PAID: 'bg-blue-100 text-blue-800 border-blue-300',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-300',
  ON_THE_WAY: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  PAYMENT_FAILED: 'bg-red-100 text-red-800 border-red-300',
};

export const DriverDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [newOrderNotification, setNewOrderNotification] = useState<number>(0);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const availableResponse = await driverAPI.getAvailableOrders();
      const myOrdersResponse = await driverAPI.getMyOrders();
      const historyResponse = await driverAPI.getHistory();

      if (availableResponse.status === 'success') {
        const newOrders = availableResponse.data || [];
        if (newOrders.length > availableOrders.length) {
          setNewOrderNotification(newOrders.length - availableOrders.length);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pesanan Baru Tersedia!', {
              body: `Anda memiliki ${newOrders.length} pesanan baru`,
              icon: '/favicon.ico',
            });
          }
        }
        setAvailableOrders(newOrders);
      }

      if (myOrdersResponse.status === 'success') {
        setMyOrders(myOrdersResponse.data || []);
      }

      if (historyResponse.status === 'success') {
        setHistoryOrders(historyResponse.data || []);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    const result = await showConfirm(
      'Terima Pesanan',
      'Apakah Anda yakin ingin menerima pesanan ini?',
      'Ya, Terima',
      'Batal'
    );

    if (result.isConfirmed) {
      try {
        const response = await driverAPI.acceptOrder(orderId);
        if (response.status === 'success') {
          await showSuccess('Pesanan Berhasil Diterima!', 'Pesanan telah ditambahkan ke daftar pesanan Anda.');
          await fetchOrders();
          setActiveTab('active'); // Switch to active tab
        }
      } catch (error: any) {
        await showError('Gagal Menerima Pesanan', error.response?.data?.message || 'Terjadi kesalahan');
      }
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    const result = await showConfirm(
      'Selesaikan Pesanan',
      'Apakah Anda yakin pesanan sudah sampai di tujuan?',
      'Ya, Selesaikan',
      'Batal'
    );

    if (result.isConfirmed) {
      try {
        const response = await driverAPI.completeOrder(orderId);
        if (response.status === 'success') {
          await showSuccess('Pesanan Berhasil Diselesaikan!', 'Terima kasih atas kerja keras Anda!');
          await fetchOrders();
        }
      } catch (error: any) {
        await showError('Gagal Menyelesaikan Pesanan', error.response?.data?.message || 'Terjadi kesalahan');
      }
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING_PAYMENT: 'Menunggu Pembayaran',
      PAID: 'Sudah Dibayar',
      PREPARING: 'Sedang Disiapkan',
      ON_THE_WAY: 'Dalam Perjalanan',
      DELIVERED: 'Selesai',
      COMPLETED: 'Selesai',
      PAYMENT_FAILED: 'Pembayaran Gagal',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Truck className="w-10 h-10 text-green-600" />
            Driver Dashboard
          </h1>
          <p className="text-gray-600">Kelola pesanan dan pengiriman Anda</p>
        </motion.div>

        {/* Navigation Tabs - More Visible */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'available'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Package className="w-5 h-5" />
            Tersedia
            {availableOrders.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{availableOrders.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Truck className="w-5 h-5" />
            Pesanan Saya (Aktif)
            {myOrders.length > 0 && (
              <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full">{myOrders.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <CheckCircle className="w-5 h-5" />
            Riwayat Selesai ({historyOrders.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'available' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pesanan Tersedia</h2>
                {availableOrders.length > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-4 py-2 text-sm font-bold animate-pulse flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {availableOrders.length} Baru
                  </span>
                )}
              </div>

              {availableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada pesanan tersedia saat ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      onAction={() => handleAcceptOrder(order.order_id)}
                      actionLabel="Terima Pesanan"
                      variant="available"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'active' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pesanan Saya (Sedang Berjalan)</h2>
              {myOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Anda tidak memiliki pesanan aktif.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      showAction={order.status === 'ON_THE_WAY'}
                      onAction={() => handleCompleteOrder(order.order_id)}
                      actionLabel="Tandai Selesai"
                      variant="active"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Pesanan</h2>
              {historyOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada riwayat pesanan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyOrders.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      showAction={false}
                      variant="history"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Component for consistency
const OrderCard: React.FC<{
  order: Order;
  onAction?: () => void;
  actionLabel?: string;
  showAction?: boolean;
  variant: 'available' | 'active' | 'history';
}> = ({ order, onAction, actionLabel, showAction = true, variant }) => {
  const statusColors: { [key: string]: string } = {
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PAID: 'bg-blue-100 text-blue-800 border-blue-300',
    PREPARING: 'bg-orange-100 text-orange-800 border-orange-300',
    ON_THE_WAY: 'bg-purple-100 text-purple-800 border-purple-300',
    DELIVERED: 'bg-green-100 text-green-800 border-green-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  };

  const getStatusLabel = (status: string) => {
    // ... (reuse logic or keep simple)
    if (status === 'ON_THE_WAY') return 'Dalam Perjalanan';
    if (status === 'DELIVERED' || status === 'COMPLETED') return 'Selesai';
    if (status === 'PREPARING') return 'Disiapkan';
    if (status === 'PAID') return 'Dibayar';
    return status;
  };

  return (
    <div className={`border rounded-xl p-5 hover:shadow-md transition-all bg-white ${variant === 'active' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Order #{order.order_id}</h3>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <ShoppingBag className="w-4 h-4" />
            {order.restaurant_name}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[order.status] || 'bg-gray-100'}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-semibold">Customer:</span> {order.customer_name}
        </p>
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="font-semibold">Alamat:</span> {order.customer_address}
        </p>
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold">Total:</span>{' '}
          <span className="font-bold text-green-600">{formatRupiah(order.total_price)}</span>
        </p>
      </div>

      <div className="mb-4 p-3 bg-gray-50/50 rounded-lg">
        <p className="text-xs font-semibold text-gray-700 mb-2">Items:</p>
        {order.items.map((item, idx) => (
          <p key={idx} className="text-xs text-gray-600">
            • {item.menu_item_name} × {item.quantity}
          </p>
        ))}
      </div>

      {showAction && onAction && (
        <Button variant="primary" className="w-full flex items-center justify-center gap-2" onClick={onAction}>
          <CheckCircle className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
