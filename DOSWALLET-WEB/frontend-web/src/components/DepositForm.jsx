import React, { useState } from 'react'
import { gql, useMutation } from '@apollo/client'
import { transactionClient } from '../services/apollo'

const DEPOSIT_MUTATION = gql`
  mutation Deposit($amount: Decimal!, $idempotencyKey: String){
    deposit(amount: $amount, idempotencyKey: $idempotencyKey) {
      transactionId
      amount
      type
      status
    }
  }
`

export default function DepositForm({ onDone, onCancel }){
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [deposit] = useMutation(DEPOSIT_MUTATION, { client: transactionClient })

  const submit = async () =>{
    setError(null)
    const a = parseFloat(amount)
    if(isNaN(a) || a <= 0){ setError('Amount must be greater than zero'); return }
    setLoading(true)
    try{
      const idempotencyKey = `deposit-${Date.now()}`
      await deposit({ variables: { amount: a, idempotencyKey } })
      onDone && onDone()
    }catch(e){
      console.error(e)
      // Try to extract GraphQL error details
      const errMsg = e?.networkError?.result?.errors?.map(err=>err.message).join('; ') || e.message || 'Unknown error'
      setError(errMsg)
    }finally{ setLoading(false) }
  }

  return (
    <div style={{border:'1px solid #ddd', padding:12}}>
      <h4>Deposit</h4>
      <div>
        <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
      </div>
      {error && <div style={{color:'red'}}>{error}</div>}
      <div style={{marginTop:8}}>
        <button onClick={submit} disabled={loading}>{loading ? 'Processing...' : 'Deposit'}</button>
        <button onClick={onCancel} style={{marginLeft:8}}>Cancel</button>
      </div>
    </div>
  )
}
