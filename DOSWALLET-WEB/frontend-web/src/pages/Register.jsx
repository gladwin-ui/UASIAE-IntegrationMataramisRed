import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// FIX: Meminta 'userId' (bukan user_id)
const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        userId
        name
        email
      }
      message
    }
  }
`;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [register, { loading }] = useMutation(REGISTER_MUTATION);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      alert('Please fill all fields');
      return;
    }

    try {
      // FIX: Format input yang benar
      const { data } = await register({ 
        variables: { 
          input: { 
            name, 
            email, 
            phone, 
            password 
          } 
        } 
      });
      
      if (data?.register?.token) {
        localStorage.setItem('token', data.register.token);
        localStorage.setItem('user', JSON.stringify(data.register.user));
        
        // FIX UTAMA: Hard Refresh
        window.location.href = '/dashboard';
      } else {
        alert(data?.register?.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Registration error');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 30px', minHeight: '100vh', background: 'white' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--primary-blue)', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Create Account</h1>
        <p style={{ color: 'var(--gray-text)', margin: 0, fontSize: '14px' }}>Join DOSWALLET for smarter banking.</p>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--dark-text)', fontSize: '13px', fontWeight: '600' }}>Full Name</label>
          <input className="input-field" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} style={{marginBottom:0}} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--dark-text)', fontSize: '13px', fontWeight: '600' }}>Email Address</label>
          <input className="input-field" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{marginBottom:0}} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--dark-text)', fontSize: '13px', fontWeight: '600' }}>Phone Number</label>
          <input className="input-field" placeholder="0812..." value={phone} onChange={e => setPhone(e.target.value)} style={{marginBottom:0}} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--dark-text)', fontSize: '13px', fontWeight: '600' }}>Password</label>
          <input type="password" className="input-field" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} style={{marginBottom:0}} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ boxShadow: '0 4px 12px rgba(0,82,156,0.2)' }}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--gray-text)' }}>
        Already have an account? <span style={{ color: 'var(--secondary-blue)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/login')}>Log In</span>
      </div>
    </div>
  );
}