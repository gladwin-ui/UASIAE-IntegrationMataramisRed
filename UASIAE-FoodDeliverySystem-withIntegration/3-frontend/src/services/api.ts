import axios from 'axios';
import { userClient, orderClient, paymentClient } from './apolloClient';
import { LOGIN_MUTATION, REGISTER_MUTATION, CREATE_ORDER_MUTATION, PAY_ORDER_MUTATION } from './graphqlQueries';


// Ganti baris API_BASE_URL
const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // allow slower local services before timing out
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        error.message = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        error.message = 'Network error. Please check your connection and ensure the server is running.';
      } else {
        error.message = error.message || 'Network error. Please try again.';
      }
    }

    // Handle HTTP errors
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not already on login/register page
      if (!window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      const response = await api.post('/users/auth/register', data);
      return response.data;
    } catch (error: any) {
      console.error('Register API error:', error);
      // Re-throw with better error message
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Registration request timeout. Please check if the server is running.');
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        throw new Error('Network error. Please check if the API Gateway is running on port 3000.');
      }
      throw error;
    }
  },
  login: async (data: { email: string; password: string }) => {
    try {
      const response = await api.post('/users/auth/login', data);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      // Re-throw with better error message
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Login request timeout. Please check if the server is running.');
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        throw new Error('Network error. Please check if the API Gateway is running on port 3000.');
      }
      throw error;
    }
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile/me');
    return response.data;
  },
  getAddresses: async () => {
    const response = await api.get('/users/addresses');
    return response.data;
  },
  createAddress: async (data: { label: string; full_address: string; latitude?: number; longitude?: number; is_default?: boolean }) => {
    const response = await api.post('/users/addresses', data);
    return response.data;
  },
  updateAddress: async (id: number, data: { label: string; full_address: string; latitude?: number; longitude?: number; is_default?: boolean }) => {
    const response = await api.put(`/users/addresses/${id}`, data);
    return response.data;
  },
  deleteAddress: async (id: number) => {
    const response = await api.delete(`/users/addresses/${id}`);
    return response.data;
  },
  // Admin endpoints
  getAllUsers: async () => {
    const response = await api.get('/users/admin/all');

    return response.data;
  },
  // Integration endpoints
  getIntegrationStatus: async (provider: string) => {
    const response = await api.get(`/users/integrations/status/${provider}`);
    return response.data;
  },
  linkIntegration: async (data: { provider: string; is_linked: boolean; provider_user_id?: string }) => {
    const response = await api.post('/users/integrations/link', data);
    return response.data;
  },
};

// Restaurant API
export const restaurantAPI = {
  getRestaurants: async (cuisineType?: string) => {
    const params = cuisineType ? { cuisine_type: cuisineType } : {};
    const response = await api.get('/restaurants', { params });
    return response.data;
  },
  getRestaurantMenu: async (restaurantId: number) => {
    const response = await api.get(`/restaurants/${restaurantId}/menu`);
    return response.data;
  },
};

// Order API
export const orderAPI = {
  createOrder: async (data: { restaurant_id: number; address_id: number; items: Array<{ menu_item_id: number; quantity: number }> }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getOrderById: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  cancelOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },
  // Admin endpoints
  getSalesStatistics: async () => {
    const response = await api.get('/orders/admin/sales/statistics');
    return response.data;
  },
  getRestaurantSales: async () => {
    const response = await api.get('/orders/admin/sales/restaurants');
    return response.data;
  },
  getAllOrders: async () => {
    const response = await api.get('/orders/admin/all');
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  simulatePayment: async (data: { order_id: number; payment_id: number; payment_method?: string }) => {
    const response = await api.post('/payments', data);

    return response.data;
  },
  getDosWalletBalance: async (userId: number) => {
    const response = await api.get(`/payments/payment-methods/doswallet/balance?user_id=${userId}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  createRestaurant: async (formData: FormData) => {
    const response = await api.post('/restaurants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateRestaurant: async (restaurantId: number, formData: FormData) => {
    const response = await api.put(`/restaurants/${restaurantId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  createMenuItem: async (restaurantId: number, formData: FormData) => {
    const response = await api.post(`/restaurants/${restaurantId}/menu`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateMenuItem: async (menuItemId: number, formData: FormData) => {
    const response = await api.put(`/restaurants/menu-items/${menuItemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  restockMenuItem: async (menuItemId: number, quantity: number) => {
    const response = await api.put(`/restaurants/menu-items/${menuItemId}/stock`, { quantity });
    return response.data;
  },
  deleteRestaurant: async (restaurantId: number) => {
    const response = await api.delete(`/restaurants/${restaurantId}`);
    return response.data;
  },
  deleteMenuItem: async (menuItemId: number) => {
    const response = await api.delete(`/restaurants/menu-items/${menuItemId}`);
    return response.data;
  },
};

// Driver API
export const driverAPI = {
  getAvailableOrders: async () => {
    const response = await api.get('/orders/available');
    return response.data;
  },
  getMyOrders: async () => {
    const response = await api.get('/orders/driver/my-orders');
    return response.data;
  },
  acceptOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/accept`);
    return response.data;
  },
  completeOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/complete`);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/orders/driver/history');
    return response.data;
  },
  // Admin endpoints for driver management
  getAllDrivers: async () => {
    const response = await api.get('/drivers/admin/all');
    return response.data;
  },
  getDriverSalaries: async () => {
    const response = await api.get('/drivers/admin/salaries');
    return response.data;
  },
  createDriverSalary: async (data: { driver_id: number; period: string }) => {
    const response = await api.post('/drivers/admin/salaries', data);
    return response.data;
  },
  updateSalaryStatus: async (salaryId: number, status: string) => {
    const response = await api.put(`/drivers/admin/salaries/${salaryId}/status`, { status });
    return response.data;
  },
  markDriverEarningsAsPaid: async (driverId: number) => {
    const response = await api.post(`/drivers/admin/salaries/pay/${driverId}`);
    return response.data;
  },
};

// Fix: Add simulatePayment to orderAPI for backward compatibility (but use paymentAPI instead)
export const orderAPIWithPayment = {
  ...orderAPI,
  simulatePayment: paymentAPI.simulatePayment,
};

// ========== GRAPHQL API METHODS ==========
// These are GraphQL versions of key Customer Flow APIs

export const authGraphQL = {
  login: async (data: { email: string; password: string }) => {
    try {
      const result = await userClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: data,
      });
      return result.data.login;
    } catch (error: any) {
      console.error('GraphQL Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (data: { name: string; email: string; password: string; phone: string; role?: string }) => {
    try {
      const result = await userClient.mutate({
        mutation: REGISTER_MUTATION,
        variables: { ...data, role: data.role || 'CUSTOMER' },
      });
      return result.data.register;
    } catch (error: any) {
      console.error('GraphQL Register error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },
};

export const orderGraphQL = {
  createOrder: async (data: { restaurant_id: number; address_id: number; items: Array<{ menu_item_id: number; quantity: number }> }) => {
    try {
      const result = await orderClient.mutate({
        mutation: CREATE_ORDER_MUTATION,
        variables: {
          restaurantId: data.restaurant_id,
          addressId: data.address_id,
          items: data.items.map(item => ({
            menuItemId: item.menu_item_id,
            quantity: item.quantity
          }))
        },
      });
      return result.data.createOrder;
    } catch (error: any) {
      console.error('GraphQL CreateOrder error:', error);
      throw new Error(error.message || 'Failed to create order');
    }
  },
};

export const paymentGraphQL = {
  /**
   * Pay for an order using GraphQL mutation.
   * IMPORTANT: Price is NOT sent from client - backend fetches it securely from DB!
   */
  payOrder: async (data: { order_id: number; payment_method: string }) => {
    try {
      const result = await paymentClient.mutate({
        mutation: PAY_ORDER_MUTATION,
        variables: {
          orderId: data.order_id,
          method: data.payment_method
        },
      });

      const paymentResult = result.data.payOrder;
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment failed');
      }

      return paymentResult;
    } catch (error: any) {
      console.error('GraphQL PayOrder error:', error);
      throw new Error(error.message || 'Payment failed');
    }
  },

  // Legacy compatibility - keep REST version for getDosWalletBalance
  getDosWalletBalance: paymentAPI.getDosWalletBalance,
};

export default api;

