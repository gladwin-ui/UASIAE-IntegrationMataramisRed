import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { transactionClient } from '../services/apollo';

// --- QUERIES & MUTATIONS (Sama seperti sebelumnya) ---
const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions($limit: Int, $offset: Int) {
    myTransactions(limit: $limit, offset: $offset) {
      transaction_id
      user_id
      amount
      type
      payment_method
      date
      receiver_id
      description
      status
    }
  }
`;

const DEPOSIT = gql`
  mutation Deposit($amount: Float!, $paymentMethod: String, $description: String) {
    deposit(amount: $amount, paymentMethod: $paymentMethod, description: $description) {
      transaction_id
      status
    }
  }
`;

const WITHDRAW = gql`
  mutation Withdraw($amount: Float!, $paymentMethod: String, $description: String) {
    withdraw(amount: $amount, paymentMethod: $paymentMethod, description: $description) {
      transaction_id
      status
    }
  }
`;

const TRANSFER = gql`
  mutation Transfer($receiverId: Int!, $amount: Float!, $description: String) {
    transfer(receiverId: $receiverId, amount: $amount, description: $description) {
      transaction_id
      status
    }
  }
`;

export default function Transactions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deposit');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form States
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer'); // Untuk Deposit/Withdraw
  const [receiverId, setReceiverId] = useState(''); // Untuk Transfer
  const [description, setDescription] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_MY_TRANSACTIONS, {
    client: transactionClient,
    variables: { limit: 20, offset: 0 },
    context: { headers: { authorization: `Bearer ${localStorage.getItem('token')}` } },
    onError: (err) => err.message.includes('Authentication') && navigate('/login')
  });

  // Setup Mutations
  const mutationOptions = {
    client: transactionClient,
    context: { headers: { authorization: `Bearer ${localStorage.getItem('token')}` } },
    onCompleted: () => {
      setMessage({ type: 'success', text: 'Transaction successful!' });
      setAmount(''); setDescription(''); setReceiverId('');
      refetch();
    },
    onError: (err) => setMessage({ type: 'error', text: err.message })
  };

  const [deposit, { loading: loadingDep }] = useMutation(DEPOSIT, mutationOptions);
  const [withdraw, { loading: loadingWid }] = useMutation(WITHDRAW, mutationOptions);
  const [transfer, { loading: loadingTra }] = useMutation(TRANSFER, mutationOptions);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const valAmount = parseFloat(amount);
    if (!valAmount || valAmount <= 0) return setMessage({ type: 'error', text: 'Invalid amount' });

    if (activeTab === 'deposit') {
      deposit({ variables: { amount: valAmount, paymentMethod: method, description: description || 'Top Up' } });
    } else if (activeTab === 'withdraw') {
      withdraw({ variables: { amount: valAmount, paymentMethod: method, description: description || 'Withdraw' } });
    } else if (activeTab === 'transfer') {
      if (!receiverId) return setMessage({ type: 'error', text: 'Receiver ID required' });
      transfer({ variables: { receiverId: parseInt(receiverId), amount: valAmount, description: description || 'Transfer' } });
    }
  };

  const isLoading = loadingDep || loadingWid || loadingTra;

  // Render Helpers
  const getTypeColor = (type) => {
    if (type === 'deposit' || type.includes('receive')) return 'var(--success)';
    return 'var(--danger)';
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Transactions</h2>
      </div>

      <div style={{ padding: '0 24px' }}>
        
        {/* Custom Tab Switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
          {['deposit', 'withdraw', 'transfer', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? 'var(--primary-blue)' : 'var(--gray-text)',
                fontWeight: activeTab === tab ? '600' : '500',
                boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '13px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {message.text && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: message.type === 'success' ? '#166534' : '#991B1B',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        {/* Forms Section */}
        {activeTab !== 'history' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 20px', textTransform: 'capitalize', color: 'var(--primary-blue)' }}>{activeTab} Money</h3>
            
            <form onSubmit={handleSubmit}>
              {activeTab === 'transfer' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--gray-text)' }}>Receiver User ID</label>
                  <input className="input-field" type="number" placeholder="Example: 101" value={receiverId} onChange={e => setReceiverId(e.target.value)} />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--gray-text)' }}>Amount (Rp)</label>
                <input className="input-field" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>

              {activeTab !== 'transfer' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--gray-text)' }}>Method</label>
                  <select className="input-field" value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="bank_transfer">Bank Transfer (BCA/Mandiri)</option>
                    <option value="e_wallet">E-Wallet (GoPay/OVO)</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--gray-text)' }}>Notes (Optional)</label>
                <input className="input-field" placeholder="Add description..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <button className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Processing...' : `Confirm ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </button>
            </form>
          </div>
        )}

        {/* History List */}
        {activeTab === 'history' && (
          <div>
            {loading && <p style={{textAlign:'center', color:'var(--gray-text)'}}>Loading history...</p>}
            {data?.myTransactions?.map((tx) => (
              <div key={tx.transaction_id} style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '16px', 
                marginBottom: '12px',
                border: '1px solid #F3F4F6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>
                    {tx.type} {tx.receiver_id ? `to #${tx.receiver_id}` : ''}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray-text)' }}>
                    {new Date(tx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '14px', color: getTypeColor(tx.type) }}>
                    {tx.type === 'deposit' || (tx.type === 'transfer' && tx.receiver_id === null) ? '+' : '-'} Rp {parseFloat(tx.amount).toLocaleString()}
                  </p>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    background: tx.status === 'completed' ? '#DCFCE7' : '#FEE2E2',
                    color: tx.status === 'completed' ? '#166534' : '#991B1B',
                    fontWeight: '600'
                  }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            {!loading && data?.myTransactions?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-text)' }}>
                <p>No transactions yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}