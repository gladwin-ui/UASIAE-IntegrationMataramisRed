import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
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
  estimated_delivery_time?: string;
}

export const Invoice: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invoice...</p>
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
  // Use backend total_price to ensure consistency (it already includes tax + delivery fee)
  const total = order.total_price || (subtotal + tax + deliveryFee);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      ON_THE_WAY: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_PAYMENT: 'Pending Payment',
      PAID: 'Paid',
      PREPARING: 'Preparing',
      ON_THE_WAY: 'On The Way',
      DELIVERED: 'Delivered',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 print:shadow-none"
        >
          {/* Header */}
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">🍔 Food Delivery</h1>
            <p className="text-gray-600">Invoice & Receipt</p>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 mb-8 print:mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-semibold text-gray-800">#{order.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(order.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6 print:mb-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Customer & Restaurant Info */}
          <div className="grid grid-cols-2 gap-4 mb-8 print:mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Customer</h3>
              <p className="text-gray-600">{order.customer_name}</p>
              <p className="text-sm text-gray-500">{order.customer_address}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Restaurant</h3>
              <p className="text-gray-600">{order.restaurant_name}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8 print:mb-4">
            <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-600">Item</th>
                  <th className="text-center py-2 text-sm font-semibold text-gray-600">Qty</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-800">{item.menu_item_name || item.name}</td>
                    <td className="text-center py-3 text-gray-600">{item.quantity}</td>
                    <td className="text-right py-3 text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="text-right py-3 font-semibold text-gray-800">
                      {formatRupiah(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price Breakdown */}
          <div className="mb-8 print:mb-4">
            <div className="space-y-2 text-right">
              <div className="flex justify-end gap-4">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-800 w-32">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-gray-600">Tax (10%):</span>
                <span className="font-medium text-gray-800 w-32">{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium text-gray-800 w-32">{formatRupiah(deliveryFee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-end gap-4">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-primary-600 w-32">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.estimated_delivery_time && (
            <div className="mb-8 print:mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Estimated Delivery Time</p>
              <p className="font-semibold text-blue-800">
                {new Date(order.estimated_delivery_time).toLocaleString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
            <p>Thank you for your order!</p>
            <p className="mt-2">You can track your order in "My Orders" section</p>
          </div>

          {/* Action Buttons (hidden when printing) */}
          <div className="flex gap-4 mt-8 print:hidden">
            <Button variant="outline" onClick={() => navigate('/orders')} className="flex-1">
              View My Orders
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              Print Invoice
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

