import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { walletClient } from '../services/apollo';

// 1. Query User (User Service) - Tetap camelCase
const GET_USER_DATA = gql`
  query GetUserData {
    me {
      userId
      name
      email
    }
  }
`;

// 2. Query Wallet (Wallet Service) - PERBAIKAN: Ubah ke snake_case sesuai Backend
const GET_WALLET_DATA = gql`
  query GetWalletData {
    my_wallet {
      wallet_id
      balance
      points
    }
  }
`;

function Wallet() {
  const navigate = useNavigate();

  // Fetch User Data
  const { 
    data: userData, 
    loading: userLoading, 
    error: userError 
  } = useQuery(GET_USER_DATA);

  // Fetch Wallet Data (Pakai walletClient)
  const { 
    data: walletData, 
    loading: walletLoading, 
    error: walletError 
  } = useQuery(GET_WALLET_DATA, {
    client: walletClient,
    context: {
      headers: {
        authorization: `Bearer ${localStorage.getItem('token')}`
      }
    },
    // Tambahkan fetchPolicy agar data selalu fresh
    fetchPolicy: 'network-only' 
  });

  if (userLoading || walletLoading) {
    return (
      <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
        <p style={{color:'var(--primary-blue)', fontWeight:'600'}}>Loading wallet info...</p>
      </div>
    );
  }

  // Tampilkan Error jika ada
  if (userError || walletError) {
    console.error("User Error:", userError);
    console.error("Wallet Error:", walletError);
    return (
      <div className="container" style={{padding:'40px', textAlign:'center'}}>
        <h3 style={{color:'var(--danger)'}}>Gagal Memuat Data</h3>
        <p style={{color:'var(--gray-text)'}}>
          {userError?.message || walletError?.message || "Terjadi kesalahan koneksi."}
        </p>
        <button className="btn-primary" style={{marginTop:'20px'}} onClick={() => window.location.reload()}>
          Coba Lagi
        </button>
        <br/><br/>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Ekstrak Data dengan aman
  const user = userData?.me || {};
  // PERBAIKAN: Ambil dari my_wallet (snake_case)
  const wallet = walletData?.my_wallet || { balance: 0, points: 0 };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>My Wallet Info</h2>
      </div>

      <div style={{ padding: '0 24px' }}>
        
        {/* KARTU BIRU (Fixed Style) */}
        <div style={{ 
          background: 'linear-gradient(135deg, #00529C 0%, #0085CA 100%)', 
          borderRadius: '20px', 
          padding: '24px', 
          color: 'white',
          boxShadow: '0 10px 20px rgba(0, 82, 156, 0.3)',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Hiasan background */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <span style={{ fontSize: '14px', opacity: 0.9, letterSpacing:'1px' }}>DOSWALLET</span>
            <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>PLATINUM</span>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Active Balance</p>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
              Rp {wallet.balance?.toLocaleString('id-ID') || 0}
            </h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', opacity: 0.8 }}>CARD HOLDER</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>
                {user.name || 'User'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', opacity: 0.8 }}>POINTS</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                {wallet.points || 0} pts
              </p>
            </div>
          </div>
        </div>

        {/* Menu Aksi */}
        <h3 style={{ fontSize: '16px', fontWeight:'600', marginBottom: '12px', color:'var(--primary-blue)' }}>Actions</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate('/transactions')}>
            📜 View Transaction History
          </button>
          <button className="btn-secondary" onClick={() => alert('Untuk melakukan Top Up, silakan gunakan menu "Transactions" -> Tab "Deposit"')}>
            💰 Top Up Balance
          </button>
        </div>

        {/* Account Info Detail */}
        <div style={{ marginTop: '30px', background: '#F9FAFB', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--gray-text)' }}>Account Details</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--dark-text)' }}>Email</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.email}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: 'var(--dark-text)' }}>User ID</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>#{user.userId}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Wallet;