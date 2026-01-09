import React, { useState } from 'react'
import { gql, useMutation } from '@apollo/client'
import { transactionClient } from '../services/apollo'

const TRANSFER_MUTATION = gql`
  mutation Transfer($receiverId: Int!, $amount: Decimal!, $idempotencyKey: String){
    transfer(receiverId: $receiverId, amount: $amount, idempotencyKey: $idempotencyKey) {
      transactionId
      amount
      type
      receiverId
    }
  }
`

export default function TransferForm({ onDone, onCancel }){
  const [receiverId, setReceiverId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [transfer] = useMutation(TRANSFER_MUTATION, { client: transactionClient })

  const submit = async () =>{
    setError(null)
    const rid = parseInt(receiverId, 10)
    const a = parseFloat(amount)
    if(isNaN(rid) || rid <= 0){ setError('Receiver ID is required'); return }
    if(isNaN(a) || a <= 0){ setError('Amount must be greater than zero'); return }
    setLoading(true)
    try{
      const idempotencyKey = `transfer-${Date.now()}`
      await transfer({ variables: { receiverId: rid, amount: a, idempotencyKey } })
      onDone && onDone()
    }catch(e){
      console.error(e)
      const errMsg = e?.networkError?.result?.errors?.map(err=>err.message).join('; ') || e.message || 'Unknown error'
      setError(errMsg)
    }finally{ setLoading(false) }
  }

  return (
    <div style={{border:'1px solid #ddd', padding:12}}>
      <h4>Transfer</h4>
      <div>
        <input placeholder="Receiver ID" value={receiverId} onChange={e=>setReceiverId(e.target.value)} />
      </div>
      <div style={{marginTop:8}}>
        <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
      </div>
      {error && <div style={{color:'red'}}>{error}</div>}
      <div style={{marginTop:8}}>
        <button onClick={submit} disabled={loading}>{loading ? 'Processing...' : 'Transfer'}</button>
        <button onClick={onCancel} style={{marginLeft:8}}>Cancel</button>
      </div>
    </div>
  )
}
