import Swal from 'sweetalert2';

/**
 * Show success notification with SweetAlert2 (modal di tengah)
 */
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    showConfirmButton: true,
    confirmButtonText: 'OKE',
    confirmButtonColor: '#f97316',
    customClass: {
      popup: 'swal2-popup-modern',
    },
    backdrop: true,
    allowOutsideClick: false,
  });
};

/**
 * Show error notification with SweetAlert2
 */
export const showError = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
      popup: 'swal2-toast',
    },
  });
};

/**
 * Show info notification with SweetAlert2
 */
export const showInfo = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
};

/**
 * Show warning notification with SweetAlert2
 */
export const showWarning = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
};

/**
 * Show confirmation dialog with SweetAlert2
 */
export const showConfirm = (
  title: string,
  message: string,
  confirmText = 'Ya',
  cancelText = 'Tidak'
) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#f97316',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'swal2-popup-modern',
    },
  });
};

