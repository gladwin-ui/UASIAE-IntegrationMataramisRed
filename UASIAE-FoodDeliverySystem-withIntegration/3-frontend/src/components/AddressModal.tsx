import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { showSuccess, showError } from '../utils/swal';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (address: { label: string; full_address: string; is_default: boolean }) => Promise<void>;
  initialData?: {
    label: string;
    full_address: string;
    is_default: boolean;
  };
  mode?: 'add' | 'edit';
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmit,
  initialData,
  mode = 'add',
}) => {
  const [formData, setFormData] = useState({
    label: initialData?.label || '',
    full_address: initialData?.full_address || '',
    is_default: initialData?.is_default || false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
      await showSuccess(
        mode === 'add' ? 'Alamat Berhasil Ditambahkan! 🎉' : 'Alamat Berhasil Diupdate! ✅'
      );
      onSuccess();
      onClose();
      setFormData({ label: '', full_address: '', is_default: false });
    } catch (error: any) {
      await showError(
        mode === 'add' ? 'Gagal Menambah Alamat' : 'Gagal Mengupdate Alamat',
        error.response?.data?.message || 'Terjadi kesalahan'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'add' ? 'Tambah Alamat Baru' : 'Edit Alamat'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Label Alamat"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Contoh: Rumah, Kantor, dll"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap
              </label>
              <textarea
                value={formData.full_address}
                onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                placeholder="Masukkan alamat lengkap"
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label className="text-sm text-gray-700">Jadikan sebagai alamat default</label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Memproses...' : mode === 'add' ? 'Tambah' : 'Simpan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Batal
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

