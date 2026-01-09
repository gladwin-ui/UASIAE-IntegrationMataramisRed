#!/usr/bin/env python3
"""Test script to debug deposit mutation"""
import requests
import json

# Test deposit mutation
url = "http://localhost:5003/graphql"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN_HERE"  # Replace with actual token
}

query = """
mutation Deposit($amount: Float!, $paymentMethod: String, $description: String) {
  deposit(
    amount: $amount
    paymentMethod: $paymentMethod
    description: $description
  ) {
    transaction_id
    user_id
    amount
    type
    status
    date
  }
}
"""

variables = {
    "amount": 100000,
    "paymentMethod": "bank_transfer",
    "description": "test"
}

payload = {
    "query": query,
    "variables": variables,
    "operationName": "Deposit"
}

print("Testing deposit mutation...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

