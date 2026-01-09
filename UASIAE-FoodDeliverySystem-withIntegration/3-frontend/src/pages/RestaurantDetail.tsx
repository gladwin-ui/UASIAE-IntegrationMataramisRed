import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { restaurantAPI, orderAPI, userAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../utils/format';
import { showSuccess, showError } from '../utils/swal';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_available: boolean;
  category?: string;
  image_url?: string;
}

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [restaurantName, setRestaurantName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const menuResponse = await restaurantAPI.getRestaurantMenu(parseInt(id!));
        if (menuResponse.status === 'success') {
          setRestaurantName(menuResponse.data.restaurant_name || 'Restaurant');
          // Remove duplicates by id and ensure all required fields
          const rawItems = menuResponse.data.menu_items || [];
          const uniqueMenuItems = rawItems
            .filter((item: any, index: number, self: any[]) => 
              index === self.findIndex((m) => m.id === item.id)
            )
            .map((item: any) => ({
              id: item.id,
              name: item.name || 'Unknown Item',
              description: item.description || '',
              price: parseFloat(item.price) || 0,
              stock: parseInt(item.stock) || 0,
              is_available: item.is_available !== false,
              category: item.category || 'Makanan',
              image_url: item.image_url || undefined,
            }));
          console.log('Menu items loaded:', uniqueMenuItems.length, uniqueMenuItems);
          setMenuItems(uniqueMenuItems);
        } else {
          console.error('Failed to fetch menu:', menuResponse);
          setError('Failed to load menu items');
        }

        const addressesResponse = await userAPI.getAddresses();
        if (addressesResponse.status === 'success') {
          const addressList = addressesResponse.data || [];
          setAddresses(addressList);
          if (addressList.length > 0) {
            const defaultAddress = addressList.find((addr: any) => addr.is_default) || addressList[0];
            setSelectedAddress(defaultAddress.id);
          } else {
            setError('Please add an address in your profile before ordering');
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.response?.data?.message || 'Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, navigate]);

  const addToCart = (item: MenuItem) => {
    if (!item.is_available || item.stock === 0) {
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.menu_item_id === item.id);
      if (existingItem) {
        if (existingItem.quantity >= item.stock) {
          setError(`Maximum stock available: ${item.stock}`);
          return prevCart;
        }
        return prevCart.map((cartItem) =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
      }
    });

    setError('');
    setSuccess('Item added to cart!');
    setTimeout(() => setSuccess(''), 5000);
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.menu_item_id !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    
    const menuItem = menuItems.find(item => item.id === menuItemId);
    if (menuItem && quantity > menuItem.stock) {
      setError(`Maximum stock available: ${menuItem.stock}`);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.menu_item_id === menuItemId ? { ...item, quantity } : item
      )
    );
    setError('');
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to cart');
      return;
    }

    // Prevent duplicate order creation
    if (isOrdering) {
      return;
    }

    setIsOrdering(true);
    setError('');
    setSuccess('');

    try {
      const response = await orderAPI.createOrder({
        restaurant_id: parseInt(id!),
        address_id: selectedAddress,
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        })),
      });

      if (response.status === 'success') {
        const orderId = response.data.order_id;
        const paymentId = response.data.payment_id;

        // Clear cart after successful order creation
        setCart([]);

        // Redirect to payment page instead of simulating payment immediately
        navigate(`/payment/${orderId}?payment_id=${paymentId}`);
      }
    } catch (error: any) {
      console.error('Order error:', error);
      setError(error.response?.data?.details || error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            ← Back to Restaurants
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{restaurantName}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-700">Menu</h2>
              <div className="flex gap-2">
                {['All', 'Makanan', 'Jajanan', 'Add On', 'Minuman'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4"
              >
                {success}
              </motion.div>
            )}

            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <p className="text-gray-600 text-lg mb-2">No menu items available</p>
                <p className="text-gray-400 text-sm">This restaurant hasn't added any menu items yet.</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {menuItems
                  .filter((item) => selectedCategory === 'All' || item.category === selectedCategory)
                  .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                            {item.category && (
                              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded mt-1 inline-block">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <span className="text-primary-600 font-bold text-lg">
                            {formatRupiah(item.price)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm ${
                            item.stock > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Stock: {item.stock}
                          </span>
                          {!item.is_available && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Not Available
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.is_available || item.stock === 0}
                          className="whitespace-nowrap"
                        >
                          Add to Cart
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Cart</h2>
                {cartItemCount > 0 && (
                  <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    {cartItemCount}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add items from the menu to get started</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <motion.div
                          key={item.menu_item_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatRupiah(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.menu_item_id)}
                              className="ml-2 text-red-600 hover:text-red-700 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Subtotal:</span>
                        <span className="text-gray-800 font-semibold">
                          {formatRupiah(totalPrice)}
                        </span>
                      </div>

                      {addresses.length > 0 ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Address
                            </label>
                            <select
                              value={selectedAddress || ''}
                              onChange={(e) => setSelectedAddress(parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              {addresses.map((addr) => (
                                <option key={addr.id} value={addr.id}>
                                  {addr.label} - {addr.full_address}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={handleOrder}
                            disabled={isOrdering || cart.length === 0}
                          >
                            {isOrdering ? (
                              <span className="flex items-center justify-center">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                Processing...
                              </span>
                            ) : (
                              `Place Order - ${formatRupiah(totalPrice)}`
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 mb-2">
                            Please add an address in your profile to place an order.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => navigate('/profile')}
                          >
                            Add Address
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
