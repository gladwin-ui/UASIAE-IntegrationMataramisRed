import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, ChefHat, Package, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { AuthModal } from '../AuthModal';
import { showConfirm, showSuccess } from '../../utils/swal';
import { AdminSidebar } from './AdminSidebar';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isDriver, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    const result = await showConfirm(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin logout?',
      'Ya, Logout',
      'Batal'
    );
    
    if (result.isConfirmed) {
      logout();
      await showSuccess('Logout Berhasil!', 'Sampai jumpa kembali!');
      navigate('/');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.span
                className="text-3xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <ChefHat className="w-8 h-8 text-orange-500" />
              </motion.span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-orange-700 transition-all">
                Food Delivery
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminSidebar(!showAdminSidebar)}
                      className="px-4 py-2 rounded-lg font-medium transition-all text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                    >
                      <Menu className="w-5 h-5" />
                      Admin Menu
                    </button>
                  )}
                  {isDriver && (
                    <Link
                      to="/driver"
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isActive('/driver')
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      Driver Dashboard
                    </Link>
                  )}
                  {isCustomer && (
                    <>
                      <Link
                        to="/browse"
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          isActive('/browse')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <ChefHat className="w-5 h-5" />
                        Browse
                      </Link>
                      <Link
                        to="/orders"
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          isActive('/orders')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <Package className="w-5 h-5" />
                        My Orders
                      </Link>
                      <Link
                        to="/profile"
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          isActive('/profile')
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        Profile
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                    <span className="text-sm text-gray-600 hidden md:block">{user?.name || user?.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)}>
                    Login
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setShowAuthModal(true)}>
                    Register
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className="p-2 text-gray-700 hover:bg-orange-50 rounded-lg"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-700 hover:bg-orange-50 rounded-lg"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-gray-200 py-4 space-y-2"
              >
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowAdminSidebar(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                      >
                        <Menu className="w-5 h-5" />
                        Admin Menu
                      </button>
                    )}
                    {isDriver && (
                      <Link
                        to="/driver"
                        onClick={() => setShowMobileMenu(false)}
                        className="block px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                      >
                        <Package className="w-5 h-5" />
                        Driver Dashboard
                      </Link>
                    )}
                    {isCustomer && (
                      <>
                        <Link
                          to="/browse"
                          onClick={() => setShowMobileMenu(false)}
                          className="block px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                        >
                          <ChefHat className="w-5 h-5" />
                          Browse
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowMobileMenu(false)}
                          className="block px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                        >
                          <Package className="w-5 h-5" />
                          My Orders
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setShowMobileMenu(false)}
                          className="block px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                        >
                          <User className="w-5 h-5" />
                          Profile
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full justify-start"
                    >
                      Login
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full"
                    >
                      Register
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Admin Sidebar - Always visible on desktop, toggle on mobile */}
      {isAdmin && (
        <AdminSidebar
          isOpen={showAdminSidebar || window.innerWidth >= 1024}
          onClose={() => setShowAdminSidebar(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />
    </>
  );
};
