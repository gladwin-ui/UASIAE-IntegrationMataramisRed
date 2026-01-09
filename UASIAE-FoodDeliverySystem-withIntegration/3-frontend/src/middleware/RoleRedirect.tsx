import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isDriver, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    const currentPath = location.pathname;
    
    // Don't redirect from login/register pages (let them handle their own redirects)
    if (currentPath === '/login' || currentPath === '/register') {
      return;
    }
    
    // Don't redirect if on profile, orders, browse, restaurant detail, payment, invoice pages
    if (currentPath === '/profile' || 
        currentPath.startsWith('/orders') || 
        currentPath === '/browse' || 
        currentPath.startsWith('/restaurants/') ||
        currentPath.startsWith('/payment/') ||
        currentPath.startsWith('/invoice/')) {
      return;
    }

    // Redirect from root path (Welcome page) to appropriate dashboard based on role
    if (currentPath === '/') {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isDriver) {
        navigate('/driver', { replace: true });
      } else if (isCustomer) {
        navigate('/browse', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isDriver, isCustomer, navigate, location.pathname]);

  return <>{children}</>;
};

