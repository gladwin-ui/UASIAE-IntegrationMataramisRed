import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { showSuccess, showError } from '../utils/swal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShake(false);

    try {
      // Simulate delay untuk response lebih cepat
      const [result] = await Promise.all([
        login(loginEmail, loginPassword),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      const role = result.role?.toUpperCase() || 'CUSTOMER';
      
      // Show success with SweetAlert2
      await showSuccess('Login Berhasil!', 'Selamat datang kembali!');
      
      onClose();
      setLoginEmail('');
      setLoginPassword('');
      
      // Redirect based on role
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/browse');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login gagal';
      await showError('Login Gagal', errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShake(false);

    try {
      // Simulate delay untuk response lebih cepat
      const [result] = await Promise.all([
        register(registerName, registerEmail, registerPassword, registerPhone),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      const role = result.role?.toUpperCase() || 'CUSTOMER';
      
      // Show success with SweetAlert2
      await showSuccess('Registrasi Berhasil!', 'Akun Anda telah dibuat!');
      
      onClose();
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterPhone('');
      setView('login');
      
      // Redirect based on role (usually CUSTOMER for new registration)
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/browse');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registrasi gagal';
      await showError('Registrasi Gagal', errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${shake ? 'animate-shake' : ''}`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                view === 'login'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                view === 'register'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Masuk ke Akun</h2>
                  <Input
                    label="Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="nama@example.com"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Memproses...' : 'Login'}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Buat Akun Baru</h2>
                  <Input
                    label="Nama Lengkap"
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    placeholder="nama@example.com"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <Input
                    label="Nomor Telepon (Opsional)"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="081234567890"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Memproses...' : 'Daftar'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

