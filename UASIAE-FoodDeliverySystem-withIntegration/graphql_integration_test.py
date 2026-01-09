#!/usr/bin/env python3
"""
GraphQL Integration Test for UASIAE Food Delivery System
Tests the complete Customer Flow via GraphQL APIs
"""

import requests
import json
import sys
from typing import Optional, Dict, Any

# Configuration
GATEWAY_URL = "http://localhost:4000"
CUSTOMER_EMAIL = "customer1@example.com"
CUSTOMER_PASSWORD = "password"

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

class GraphQLTester:
    def __init__(self):
        self.jwt_token: Optional[str] = None
        self.order_id: Optional[int] = None
        self.restaurant_id: Optional[int] = None
        self.menu_item_id: Optional[int] = None
        self.address_id: int = 1  # Assuming customer has address ID 1
        
    def print_success(self, message: str):
        print(f"{GREEN}✅ {message}{RESET}")
        
    def print_error(self, message: str):
        print(f"{RED}❌ {message}{RESET}")
        
    def print_info(self, message: str):
        print(f"{YELLOW}ℹ️  {message}{RESET}")
        
    def graphql_request(self, endpoint: str, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a GraphQL request"""
        url = f"{GATEWAY_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
            
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
            
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.print_error(f"Request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                self.print_error(f"Response: {e.response.text}")
            return {"errors": [{"message": str(e)}]}
    
    def scenario_a_login(self) -> bool:
        """Scenario A: Customer Authentication"""
        print("\n" + "="*60)
        print("SCENARIO A: Customer Authentication (FDS)")
        print("="*60)
        
        query = """
        mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
                user {
                    id
                    name
                    email
                    role
                }
            }
        }
        """
        
        variables = {
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        }
        
        self.print_info(f"Logging in as {CUSTOMER_EMAIL}...")
        result = self.graphql_request("/user/graphql", query, variables)
        
        if "errors" in result:
            self.print_error(f"Login failed: {result['errors']}")
            return False
            
        if "data" in result and result["data"].get("login"):
            login_data = result["data"]["login"]
            self.jwt_token = login_data.get("token")
            user = login_data.get("user", {})
            
            self.print_success(f"Login successful!")
            self.print_info(f"User: {user.get('name')} ({user.get('email')})")
            self.print_info(f"Role: {user.get('role')}")
            self.print_info(f"JWT Token: {self.jwt_token[:20]}...")
            return True
        else:
            self.print_error("Login failed: No data returned")
            return False
    
    def scenario_b_create_order(self) -> bool:
        """Scenario B: Browse & Create Order"""
        print("\n" + "="*60)
        print("SCENARIO B: Browse Restaurant & Create Order (FDS)")
        print("="*60)
        
        # First, get restaurants
        query_restaurants = """
        query GetRestaurants {
            restaurants {
                id
                name
                address
                category
            }
        }
        """
        
        self.print_info("Fetching restaurants...")
        result = self.graphql_request("/restaurant/graphql", query_restaurants)
        
        if "errors" in result or not result.get("data", {}).get("restaurants"):
            self.print_error("Failed to fetch restaurants")
            return False
            
        restaurants = result["data"]["restaurants"]
        if not restaurants:
            self.print_error("No restaurants found")
            return False
            
        self.restaurant_id = restaurants[0]["id"]
        self.print_success(f"Found restaurant: {restaurants[0]['name']} (ID: {self.restaurant_id})")
        
        # Get restaurant menu
        query_menu = """
        query GetRestaurant($id: Int!) {
            restaurant(id: $id) {
                id
                name
                menus {
                    id
                    name
                    price
                    stock
                }
            }
        }
        """
        
        self.print_info(f"Fetching menu for restaurant ID {self.restaurant_id}...")
        result = self.graphql_request("/restaurant/graphql", query_menu, {"id": self.restaurant_id})
        
        if "errors" in result:
            self.print_error("Failed to fetch menu")
            return False
            
        restaurant = result["data"]["restaurant"]
        menus = restaurant.get("menus", [])
        
        if not menus:
            self.print_error("No menu items found")
            return False
            
        self.menu_item_id = menus[0]["id"]
        self.print_success(f"Found menu item: {menus[0]['name']} - Rp {menus[0]['price']} (ID: {self.menu_item_id})")
        
        # Create order
        query_create_order = """
        mutation CreateOrder($restaurantId: Int!, $addressId: Int!, $items: [OrderItemInput!]!) {
            createOrder(restaurantId: $restaurantId, addressId: $addressId, items: $items) {
                id
                userId
                restaurantId
                status
                totalPrice
                items {
                    menuItemName
                    quantity
                    price
                }
            }
        }
        """
        
        order_variables = {
            "restaurantId": self.restaurant_id,
            "addressId": self.address_id,
            "items": [
                {"menuItemId": self.menu_item_id, "quantity": 2}
            ]
        }
        
        self.print_info("Creating order with 2 items...")
        result = self.graphql_request("/order/graphql", query_create_order, order_variables)
        
        if "errors" in result:
            self.print_error(f"Order creation failed: {result['errors']}")
            return False
            
        if "data" in result and result["data"].get("createOrder"):
            order = result["data"]["createOrder"]
            self.order_id = order["id"]
            
            self.print_success(f"Order created successfully!")
            self.print_info(f"Order ID: {self.order_id}")
            self.print_info(f"Status: {order['status']}")
            self.print_info(f"Total Price: Rp {order['totalPrice']}")
            self.print_info(f"Items: {len(order['items'])} item(s)")
            return True
        else:
            self.print_error("Order creation failed: No data returned")
            return False
    
    def scenario_c_payment(self) -> bool:
        """Scenario C: Payment with DosWallet (Critical S2S Integration)"""
        print("\n" + "="*60)
        print("SCENARIO C: Payment with DosWallet (S2S Integration)")
        print("="*60)
        
        if not self.order_id:
            self.print_error("No order ID available. Cannot proceed with payment.")
            return False
        
        query_pay_order = """
        mutation PayOrder($orderId: Int!, $method: String!) {
            payOrder(orderId: $orderId, method: $method) {
                success
                message
                payment {
                    id
                    orderId
                    userId
                    amount
                    status
                    paymentMethod
                    createdAt
                }
            }
        }
        """
        
        payment_variables = {
            "orderId": self.order_id,
            "method": "DOSWALLET"
        }
        
        self.print_info(f"Processing payment for Order ID {self.order_id} via DosWallet...")
        self.print_info("⚠️  This triggers S2S GraphQL call: Payment Service → DosWallet Transaction Service")
        
        result = self.graphql_request("/payment/graphql", query_pay_order, payment_variables)
        
        if "errors" in result:
            self.print_error(f"Payment failed with GraphQL errors: {result['errors']}")
            return False
            
        if "data" in result and result["data"].get("payOrder"):
            pay_result = result["data"]["payOrder"]
            
            if pay_result["success"]:
                payment = pay_result["payment"]
                self.print_success("Payment completed successfully!")
                self.print_info(f"Payment ID: {payment['id']}")
                self.print_info(f"Amount: Rp {payment['amount']}")
                self.print_info(f"Status: {payment['status']}")
                self.print_info(f"Method: {payment['paymentMethod']}")
                return True
            else:
                self.print_error(f"Payment failed: {pay_result['message']}")
                return False
        else:
            self.print_error("Payment failed: No data returned")
            return False
    
    def scenario_d_verify_wallet(self) -> bool:
        """Scenario D: Cross-System Verification (DosWallet)"""
        print("\n" + "="*60)
        print("SCENARIO D: Verify DosWallet Transaction History")
        print("="*60)
        
        query_wallet_history = """
        query GetPaymentHistory {
            paymentHistory {
                id
                orderId
                userId
                amount
                status
                paymentMethod
                createdAt
            }
        }
        """
        
        self.print_info("Fetching payment history...")
        result = self.graphql_request("/payment/graphql", query_wallet_history)
        
        if "errors" in result:
            self.print_error(f"Failed to fetch payment history: {result['errors']}")
            return False
            
        if "data" in result and result["data"].get("paymentHistory"):
            history = result["data"]["paymentHistory"]
            
            self.print_success(f"Found {len(history)} payment(s) in history")
            
            # Find our order
            our_payment = next((p for p in history if p["orderId"] == self.order_id), None)
            
            if our_payment:
                self.print_success(f"✅ Verified payment for Order ID {self.order_id}")
                self.print_info(f"Amount: Rp {our_payment['amount']}")
                self.print_info(f"Status: {our_payment['status']}")
                self.print_info(f"Method: {our_payment['paymentMethod']}")
                return True
            else:
                self.print_error(f"Payment for Order ID {self.order_id} not found in history")
                return False
        else:
            self.print_error("Failed to fetch payment history")
            return False
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("\n" + "🚀 " * 20)
        print("GraphQL Integration Test - UASIAE Food Delivery System")
        print("🚀 " * 20)
        
        results = {
            "Scenario A (Login)": self.scenario_a_login(),
            "Scenario B (Create Order)": self.scenario_b_create_order() if self.jwt_token else False,
            "Scenario C (Payment)": self.scenario_c_payment() if self.order_id else False,
            "Scenario D (Verify Wallet)": self.scenario_d_verify_wallet() if self.jwt_token else False,
        }
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in results.values() if r)
        total = len(results)
        
        for scenario, result in results.items():
            status = f"{GREEN}✅ PASSED{RESET}" if result else f"{RED}❌ FAILED{RESET}"
            print(f"{scenario}: {status}")
        
        print("\n" + "="*60)
        success_rate = (passed / total) * 100
        print(f"Success Rate: {passed}/{total} ({success_rate:.1f}%)")
        
        if passed == total:
            print(f"{GREEN}🎉 ALL TESTS PASSED! GraphQL Migration is working correctly!{RESET}")
            return 0
        else:
            print(f"{RED}⚠️  Some tests failed. Please review the errors above.{RESET}")
            return 1

if __name__ == "__main__":
    tester = GraphQLTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
