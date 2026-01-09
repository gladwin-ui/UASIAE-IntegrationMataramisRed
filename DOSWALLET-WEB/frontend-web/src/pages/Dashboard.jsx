import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { walletClient } from '../services/apollo';

// 1. Query User
const GET_USER_HEADER = gql`
  query GetUserHeader {
    me {
      name
    }
  }
`;

// 2. Query Wallet (Gunakan my_wallet snake_case)
const GET_WALLET_DASHBOARD = gql`
  query GetWalletDashboard {
    my_wallet {
      balance
      points
    }
  }
`;

function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch Data User
  const { data: userData } = useQuery(GET_USER_HEADER);
  
  // Fetch Data Wallet (Pakai walletClient & network-only)
  const { data: walletData, loading: walletLoading, error: walletError } = useQuery(GET_WALLET_DASHBOARD, {
    client: walletClient,
    fetchPolicy: 'network-only',
    context: { headers: { authorization: `Bearer ${localStorage.getItem('token')}` } }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Hard refresh logout
  };

  const user = userData?.me;
  const wallet = walletData?.my_wallet || { balance: 0, points: 0 };

  const services = [
    { name: 'Transfer', icon: '💸', path: '/transactions', color: '#E0F2FE' },
    { name: 'Top Up', icon: '📥', path: '/transactions', color: '#DCFCE7' },
    { name: 'Withdraw', icon: '🏧', path: '/transactions', color: '#FEF3C7' },
    { name: 'History', icon: '📜', path: '/transactions', color: '#F3E8FF' },
  ];

  return (
    <div className="container" style={{ background: '#F3F4F6', minHeight: '100vh', paddingBottom:'20px' }}>
      
      {/* HEADER BIRU GRADASI */}
      <div style={{ 
        background: 'linear-gradient(180deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)', 
        padding: '30px 24px 80px', 
        borderBottomLeftRadius: '30px', 
        borderBottomRightRadius: '30px',
        color: 'white',
        position: 'relative'
      }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '13px' }}>Good Morning,</p>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', textTransform: 'capitalize' }}>
              {user?.name || 'User'}
            </h2>
          </div>
          <div 
            onClick={() => navigate('/wallet')} 
            style={{ 
              width: '40px', height: '40px', 
              background: 'rgba(255,255,255,0.2)', 
              backdropFilter: 'blur(5px)',
              borderRadius: '12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', fontSize: '18px'
            }}
          >
            👤
          </div>
        </div>

        {/* Floating Balance Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '24px', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
          color: 'var(--dark-text)',
          position: 'absolute',
          left: '24px',
          right: '24px',
          bottom: '-50px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--gray-text)', fontWeight: '500' }}>Total Balance</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#D97706' }}>⭐</span>
              <span style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: '700' }}>
                {walletLoading ? '...' : wallet.points} Pts
              </span>
            </div>
          </div>
          
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {walletLoading ? 'Loading...' : `Rp ${wallet.balance?.toLocaleString('id-ID')}`}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginTop: '70px', padding: '0 24px' }}>
        
        {/* Quick Actions */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--dark-text)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '30px' }}>
          {services.map((service, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(service.path)} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '100%', aspectRatio: '1/1', 
                background: 'white', 
                borderRadius: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '24px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                transition: 'transform 0.1s'
              }}>
                {service.icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-text)' }}>{service.name}</span>
            </div>
          ))}
        </div>

        {/* Promo Banner */}
        <div style={{ 
          background: 'linear-gradient(90deg, #2563EB, #60A5FA)', 
          borderRadius: '16px', 
          padding: '20px', 
          color: 'white', 
          marginBottom: '24px', 
          display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
        }}>
          <div style={{ fontSize: '32px' }}>🍔</div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Food Delivery Cashback</h4>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Get 5% points back on every order.</p>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          style={{ width: '100%', padding: '16px', background: 'white', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;