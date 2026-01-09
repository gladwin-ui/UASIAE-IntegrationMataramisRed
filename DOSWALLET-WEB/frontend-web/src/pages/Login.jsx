import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// FIX: Menggunakan format Input & meminta userId (camelCase)
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        userId
        name
      }
    }
  }
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // FIX: Bungkus email/password ke dalam objek "input"
      const result = await login({ 
        variables: { 
          input: { 
            email: email, 
            password: password 
          } 
        } 
      });
      
      const { token, user } = result.data.login;
      
      // Simpan Token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // FIX UTAMA: Gunakan Hard Refresh agar Dashboard bisa membaca Token baru
      window.location.href = '/dashboard';
      
    } catch (err) {
      console.error("Login Gagal:", err);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 30px', minHeight: '100vh', background: 'white' }}>
      
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', 
          background: 'linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))', 
          borderRadius: '16px', 
          margin: '0 auto 20px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'white', fontWeight: 'bold', fontSize: '28px',
          boxShadow: '0 10px 20px rgba(0,82,156,0.2)'
        }}>
          D
        </div>
        <h1 style={{ color: 'var(--primary-blue)', fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>DOSWALLET</h1>
        <p style={{ color: 'var(--gray-text)', marginTop: '8px', fontSize: '14px' }}>Integrated Payment System</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dark-text)', fontWeight: '600', fontSize: '14px' }}>Email Address</label>
          <input
            type="email"
            className="input-field"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: 0 }} 
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dark-text)', fontWeight: '600', fontSize: '14px' }}>Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: 0 }}
          />
        </div>

        {error && (
          <div style={{ 
            padding: '12px', background: '#FEE2E2', color: '#B91C1C', 
            borderRadius: '12px', marginBottom: '24px', fontSize: '13px', textAlign: 'center' 
          }}>
            {error.message}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ boxShadow: '0 4px 12px rgba(0,82,156,0.2)' }}>
          {loading ? 'Authenticating...' : 'Log In'}
        </button>
      </form>

      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: 'var(--gray-text)' }}>
        Don't have an account? <span style={{ color: 'var(--secondary-blue)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/register')}>Sign Up</span>
      </div>
    </div>
  );
}

export default Login;