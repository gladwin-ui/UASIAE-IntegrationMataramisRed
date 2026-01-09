import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Edit, Trash2, ChefHat, Image as ImageIcon, X } from 'lucide-react';
import { restaurantAPI, adminAPI } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatRupiah } from '../../utils/format';
import { showSuccess, showError, showConfirm } from '../../utils/swal';

interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  address: string;
  is_open: boolean;
  image_url?: string;
}

interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_available: boolean;
  category?: string;
  image_url?: string;
}

export const ManageRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<number | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine_type: '',
    address: '',
  });
  const [newRestaurantImage, setNewRestaurantImage] = useState<File | null>(null);
  const [editRestaurant, setEditRestaurant] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    is_open: true,
  });
  const [editRestaurantImage, setEditRestaurantImage] = useState<File | null>(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Makanan',
  });
  const [newMenuItemImage, setNewMenuItemImage] = useState<File | null>(null);
  const [editMenuItem, setEditMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Makanan',
    is_available: true,
  });
  const [editMenuItemImage, setEditMenuItemImage] = useState<File | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await restaurantAPI.getRestaurants();
      if (response.status === 'success') {
        setRestaurants(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId: number) => {
    try {
      const response = await restaurantAPI.getRestaurantMenu(restaurantId);
      if (response.status === 'success') {
        const items: MenuItem[] = response.data.menu_items || [];
        const uniqueItems: MenuItem[] = Array.from(new Map(items.map((item) => [item.id, item])).values());
        setMenuItems(uniqueItems);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newRestaurant.name);
      formData.append('cuisine_type', newRestaurant.cuisine_type);
      formData.append('address', newRestaurant.address);
      formData.append('is_open', 'true');
      if (newRestaurantImage) {
        formData.append('image', newRestaurantImage);
      }

      const response = await adminAPI.createRestaurant(formData);
      if (response.status === 'success') {
        await showSuccess('Restoran Berhasil Ditambahkan!', 'Restoran baru telah ditambahkan ke sistem.');
        await fetchRestaurants();
        setShowAddRestaurant(false);
        setNewRestaurant({ name: '', cuisine_type: '', address: '' });
        setNewRestaurantImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Menambah Restoran', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      await showError('Pilih Restoran', 'Silakan pilih restoran terlebih dahulu');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newMenuItem.name);
      formData.append('description', newMenuItem.description);
      formData.append('price', newMenuItem.price);
      formData.append('stock', newMenuItem.stock);
      formData.append('category', newMenuItem.category);
      if (newMenuItemImage) {
        formData.append('image', newMenuItemImage);
      }

      const response = await adminAPI.createMenuItem(selectedRestaurant, formData);
      if (response.status === 'success') {
        await showSuccess('Menu Berhasil Ditambahkan!', 'Menu baru telah ditambahkan.');
        await fetchMenuItems(selectedRestaurant);
        setShowAddMenu(false);
        setNewMenuItem({ name: '', description: '', price: '', stock: '', category: 'Makanan' });
        setNewMenuItemImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Menambah Menu', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleUpdateRestaurant = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editRestaurant.name);
      formData.append('cuisine_type', editRestaurant.cuisine_type);
      formData.append('address', editRestaurant.address);
      formData.append('is_open', editRestaurant.is_open.toString());
      if (editRestaurantImage) {
        formData.append('image', editRestaurantImage);
      }

      const response = await adminAPI.updateRestaurant(id, formData);
      if (response.status === 'success') {
        await showSuccess('Restoran Berhasil Diupdate!', 'Data restoran telah diperbarui.');
        await fetchRestaurants();
        setEditingRestaurant(null);
        setEditRestaurantImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Mengupdate Restoran', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleUpdateMenuItem = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editMenuItem.name);
      formData.append('description', editMenuItem.description);
      formData.append('price', editMenuItem.price);
      formData.append('stock', editMenuItem.stock);
      formData.append('category', editMenuItem.category);
      formData.append('is_available', editMenuItem.is_available.toString());
      if (editMenuItemImage) {
        formData.append('image', editMenuItemImage);
      }

      const response = await adminAPI.updateMenuItem(id, formData);
      if (response.status === 'success') {
        await showSuccess('Menu Berhasil Diupdate!', 'Data menu telah diperbarui.');
        if (selectedRestaurant) {
          await fetchMenuItems(selectedRestaurant);
        }
        setEditingMenuItem(null);
        setEditMenuItemImage(null);
      }
    } catch (error: any) {
      await showError('Gagal Mengupdate Menu', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDeleteRestaurant = async (id: number) => {
    const restaurant = restaurants.find(r => r.id === id);
    const result = await showConfirm(
      'Hapus Restoran',
      `Apakah Anda yakin ingin menghapus restoran "${restaurant?.name}"? Tindakan ini tidak dapat dibatalkan.`,
      'Ya, Hapus',
      'Batal'
    );

    if (result.isConfirmed) {
      try {
        const response = await adminAPI.deleteRestaurant(id);
        if (response.status === 'success') {
          await showSuccess('Restoran Berhasil Dihapus!', 'Restoran telah dihapus dari sistem.');
          await fetchRestaurants();
          if (selectedRestaurant === id) {
            setSelectedRestaurant(null);
            setMenuItems([]);
          }
        }
      } catch (error: any) {
        await showError('Gagal Menghapus Restoran', error.response?.data?.message || 'Terjadi kesalahan');
      }
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    const menuItem = menuItems.find(m => m.id === id);
    const result = await showConfirm(
      'Hapus Menu',
      `Apakah Anda yakin ingin menghapus menu "${menuItem?.name}"?`,
      'Ya, Hapus',
      'Batal'
    );

    if (result.isConfirmed) {
      try {
        const response = await adminAPI.deleteMenuItem(id);
        if (response.status === 'success') {
          await showSuccess('Menu Berhasil Dihapus!', 'Menu telah dihapus.');
          if (selectedRestaurant) {
            await fetchMenuItems(selectedRestaurant);
          }
        }
      } catch (error: any) {
        await showError('Gagal Menghapus Menu', error.response?.data?.message || 'Terjadi kesalahan');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="w-full lg:pl-64">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Store className="w-10 h-10 text-orange-500" />
                Manage Restaurants
              </h1>
              <p className="text-gray-600">Kelola restoran dan menu makanan</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddRestaurant(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Restoran
            </Button>
          </div>
        </motion.div>

        {/* Restaurants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Daftar Restoran</h2>
              <p className="text-gray-600 text-sm mt-1">Total: {restaurants.length} restoran</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all ${
                  selectedRestaurant === restaurant.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {editingRestaurant === restaurant.id ? (
                  <form onSubmit={(e) => handleUpdateRestaurant(e, restaurant.id)} className="space-y-3">
                    <Input
                      label="Nama"
                      value={editRestaurant.name}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Tipe Masakan"
                      value={editRestaurant.cuisine_type}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, cuisine_type: e.target.value })}
                      required
                    />
                    <Input
                      label="Alamat"
                      value={editRestaurant.address}
                      onChange={(e) => setEditRestaurant({ ...editRestaurant, address: e.target.value })}
                      required
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editRestaurant.is_open}
                        onChange={(e) => setEditRestaurant({ ...editRestaurant, is_open: e.target.checked })}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700">Buka</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditRestaurantImage(e.target.files?.[0] || null)}
                        className="text-sm w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" variant="primary" size="sm" className="flex-1">Simpan</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRestaurant(null)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    {restaurant.image_url ? (
                      <div className="h-32 mb-3 rounded-lg overflow-hidden">
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 mb-3 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                        <Store className="w-12 h-12 text-orange-600" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <ChefHat className="w-4 h-4" />
                          {restaurant.cuisine_type}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          restaurant.is_open
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {restaurant.is_open ? 'Buka' : 'Tutup'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{restaurant.address}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRestaurant(restaurant.id);
                          setEditRestaurant({
                            name: restaurant.name,
                            cuisine_type: restaurant.cuisine_type,
                            address: restaurant.address,
                            is_open: restaurant.is_open,
                          });
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRestaurant(restaurant.id)}
                        className={`flex items-center gap-1 ${
                          selectedRestaurant === restaurant.id ? 'bg-orange-500 text-white border-orange-500' : ''
                        }`}
                      >
                        <ChefHat className="w-4 h-4" />
                        Menu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="text-red-600 hover:bg-red-50 border-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Menu Management */}
        {selectedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-orange-500" />
                  Menu Restoran
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {restaurants.find((r) => r.id === selectedRestaurant)?.name} - {menuItems.length} menu
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAddMenu(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Tambah Menu
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingMenuItem === item.id ? (
                    <form onSubmit={(e) => handleUpdateMenuItem(e, item.id)} className="space-y-3">
                      <Input
                        label="Nama Menu"
                        value={editMenuItem.name}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Deskripsi"
                        value={editMenuItem.description}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, description: e.target.value })}
                        required
                      />
                      <Input
                        label="Harga"
                        type="number"
                        value={editMenuItem.price}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, price: e.target.value })}
                        required
                      />
                      <Input
                        label="Stok"
                        type="number"
                        value={editMenuItem.stock}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, stock: e.target.value })}
                        required
                      />
                      <select
                        value={editMenuItem.category}
                        onChange={(e) => setEditMenuItem({ ...editMenuItem, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Dessert">Dessert</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editMenuItem.is_available}
                          onChange={(e) => setEditMenuItem({ ...editMenuItem, is_available: e.target.checked })}
                          className="rounded"
                        />
                        <label className="text-sm text-gray-700">Tersedia</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditMenuItemImage(e.target.files?.[0] || null)}
                          className="text-sm w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="sm" className="flex-1">Simpan</Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMenuItem(null)}
                          className="flex-1"
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {item.image_url ? (
                        <div className="h-32 mb-3 rounded-lg overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 mb-3 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-orange-600" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-orange-600">{formatRupiah(item.price)}</span>
                        <span className="text-sm text-gray-600">Stok: {item.stock}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMenuItem(item.id);
                            setEditMenuItem({
                              name: item.name,
                              description: item.description,
                              price: item.price.toString(),
                              stock: item.stock.toString(),
                              category: item.category || 'Makanan',
                              is_available: item.is_available,
                            });
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="text-red-600 hover:bg-red-50 border-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add Restaurant Modal */}
        {showAddRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Tambah Restoran</h3>
                <button
                  onClick={() => setShowAddRestaurant(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <Input
                  label="Nama Restoran"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  required
                />
                <Input
                  label="Tipe Masakan"
                  value={newRestaurant.cuisine_type}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                  required
                />
                <Input
                  label="Alamat"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Gambar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewRestaurantImage(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1">Tambah</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddRestaurant(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Menu Modal */}
        {showAddMenu && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Tambah Menu</h3>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddMenu} className="space-y-4">
                <Input
                  label="Nama Menu"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  required
                />
                <Input
                  label="Deskripsi"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  required
                />
                <Input
                  label="Harga"
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                  required
                />
                <Input
                  label="Stok"
                  type="number"
                  value={newMenuItem.stock}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, stock: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Gambar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewMenuItemImage(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1">Tambah</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMenu(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

