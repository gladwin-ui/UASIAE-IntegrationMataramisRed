import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, MapPin } from 'lucide-react';
import { restaurantAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/AuthModal';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  address: string;
  is_open: boolean;
  image_url?: string;
}

export const Home: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantAPI.getRestaurants(filter || undefined);
        if (response.status === 'success') {
          const uniqueRestaurants = (response.data || []).filter(
            (r: Restaurant, index: number, self: Restaurant[]) =>
              index === self.findIndex((rest) => rest.id === r.id)
          );
          setRestaurants(uniqueRestaurants);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [filter]);

  const cuisineTypes = ['All', 'Padang', 'Sunda', 'Jawa', 'Western', 'Fast Food'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat restoran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
              <ChefHat className="w-12 h-12 md:w-16 md:h-16" />
              Food Delivery
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100">
              Pesan makanan favoritmu dari restoran terbaik
            </p>
            {!isAuthenticated && (
              <div className="flex gap-4 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 text-lg"
                >
                  Daftar Sekarang
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Jelajahi Restoran</h2>
          <div className="flex flex-wrap gap-3">
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setFilter(cuisine === 'All' ? '' : cuisine)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  filter === (cuisine === 'All' ? '' : cuisine)
                    ? 'bg-orange-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 border border-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Restaurants Grid */}
        {restaurants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-gray-600 text-lg">Tidak ada restoran ditemukan</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate(`/restaurants/${restaurant.id}`);
                  } else {
                    setShowAuthModal(true);
                  }
                }}
              >
                {restaurant.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-orange-600" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {restaurant.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        restaurant.is_open
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {restaurant.is_open ? 'Buka' : 'Tutup'}
                    </span>
                  </div>
                  <p className="text-orange-600 font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {restaurant.cuisine_type}
                  </p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{restaurant.address}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full group-hover:bg-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAuthenticated) {
                        navigate(`/restaurants/${restaurant.id}`);
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                  >
                    Lihat Menu →
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialView="register" />
    </div>
  );
};
