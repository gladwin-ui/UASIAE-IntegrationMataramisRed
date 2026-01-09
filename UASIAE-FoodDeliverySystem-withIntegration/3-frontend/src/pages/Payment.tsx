import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI, paymentAPI, restaurantAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';

interface OrderItem {
  menu_item_name?: string;
  name?: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  restaurant_name: string;
  customer_name: string;
  customer_address: string;
  status: string;
  total_price: number;
  items: OrderItem[];
  created_at: string;
}

interface Payment {
  payment_id: number;
  order_id: number;
  amount: number;
  status: string;
}

export const Payment: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('E-Wallet');
  const [dosBalance, setDosBalance] = useState<number | null>(null);
  const [isDosLinked, setIsDosLinked] = useState(false);
  const [dosLoading, setDosLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkDosWalletStatus(user.id);
    }
  }, [user]);

  const checkDosWalletStatus = async (userId: number) => {
    setDosLoading(true);
    try {
      const status = await userAPI.getIntegrationStatus('DOSWALLET');
      if (status.status === 'success' && status.linked) {
        setIsDosLinked(true);
        // Fetch Balance
        try {
          const balRes = await paymentAPI.getDosWalletBalance(userId);
          setDosBalance(balRes.balance);
        } catch (e) {
          console.error("Failed to fetch balance", e);
        }
      } else {
        setIsDosLinked(false);
      }
    } catch (error) {
      console.error("Failed to check integration", error);
    } finally {
      setDosLoading(false);
    }
  };

  const handleLinkDosWallet = async () => {
    setIsProcessing(true);
    try {
      // Smart Linking: Backend will lookup DosWallet user by our email
      await userAPI.linkIntegration({
        provider: 'DOSWALLET',
        is_linked: true,
        provider_user_id: undefined // Backend handles lookup
      });
      await checkDosWalletStatus(user?.id || 0); // Reload status
      alert('Berhasil menghubungkan akun DosWallet!');
    } catch (error: any) {
      console.error("Failed to link DosWallet", error);
      const msg = error.response?.data?.detail || 'Gagal menghubungkan akun. Pastikan Anda sudah terdaftar di DosWallet dengan email yang sama.';
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const orderResponse = await orderAPI.getOrderById(parseInt(orderId!));
      if (orderResponse.status === 'success') {
        setOrder(orderResponse.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch order details');
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation Modal State
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);

  const handleConfirmPayment = async () => {
    if (!orderId || !paymentId) {
      setError('Order ID or Payment ID is missing');
      return;
    }

    // Check Balance for DosWallet
    if (paymentMethod === 'DOSWALLET' && isDosLinked && dosBalance !== null) {
      if (dosBalance < total) {
        setShowLowBalanceModal(true);
        return;
      }
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await paymentAPI.simulatePayment({
        order_id: parseInt(orderId),
        payment_id: parseInt(paymentId),
        payment_method: paymentMethod,
        ...(paymentMethod === 'DOSWALLET' && user ? { user_id: user.id } : {})
      } as any);

      if (response.status === 'success') {
        navigate(`/invoice/${orderId}`);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to process payment');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsProcessing(true);
      await orderAPI.cancelOrder(order.order_id);
      navigate('/orders');
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  // Calculate from order items (backend already includes tax and delivery fee in total_price)
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const deliveryFee = 10000; // Fixed delivery fee
  const total = order.total_price || (subtotal + tax + deliveryFee);

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Modal Alert */}
      {showLowBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Saldo Tidak Mencukupi</h3>
            <p className="text-gray-600 mb-6">
              Saldo DosWallet Anda ({formatRupiah(dosBalance || 0)}) tidak cukup untuk membayar tagihan sebesar {formatRupiah(total)}.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLowBalanceModal(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  window.open('http://localhost:3001', '_blank');
                  setShowLowBalanceModal(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Top Up Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment Confirmation</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Restaurant</p>
                <p className="font-semibold text-gray-800">{order.restaurant_name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-semibold text-gray-800">{order.customer_address}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold text-gray-800">#{order.order_id}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{item.menu_item_name || item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatRupiah(item.price)}</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatRupiah(deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="E-Wallet"
                  checked={paymentMethod === 'E-Wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">E-Wallet</span>
              </label>

              {/* DOSWALLET OPTION */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-colors ${paymentMethod === 'DOSWALLET' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                <label className="flex items-center cursor-pointer mb-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="DOSWALLET"
                    checked={paymentMethod === 'DOSWALLET'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800 flex items-center">
                      <span className="mr-2">DosWallet</span>
                      {isDosLinked && dosBalance !== null && (
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          Saldo: {formatRupiah(dosBalance)}
                        </span>
                      )}
                    </span>
                  </div>
                </label>

                {paymentMethod === 'DOSWALLET' && (
                  <div className="ml-7 mt-2">
                    {dosLoading ? (
                      <p className="text-sm text-gray-500">Checking status...</p>
                    ) : !isDosLinked ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Akun DosWallet belum terhubung.</p>
                        <Button
                          size="sm"
                          onClick={handleLinkDosWallet}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Hubungkan Akun
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {dosBalance !== null && dosBalance < total ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-red-600">Saldo tidak mencukupi. Top up di aplikasi DosWallet.</p>
                            <Button
                              size="sm"
                              onClick={() => window.open('http://localhost:3001', '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs w-full"
                            >
                              Top Up Saldo
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-green-600">Saldo mencukupi. Siap bayar.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Bank Transfer"
                  checked={paymentMethod === 'Bank Transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">Bank Transfer</span>
              </label>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-800">Cash on Delivery</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              disabled={isProcessing}
              className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Order'}
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </motion.div>
      </div >
    </div >
  );
};

