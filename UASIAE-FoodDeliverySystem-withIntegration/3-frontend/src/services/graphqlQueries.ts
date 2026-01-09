import { gql } from '@apollo/client';

// ========== USER SERVICE QUERIES/MUTATIONS ==========

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        phone
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!, $phone: String!, $role: String) {
    register(name: $name, email: $email, password: $password, phone: $phone, role: $role) {
      token
      user {
        id
        name
        email
        role
        phone
      }
    }
  }
`;

export const GET_ME_QUERY = gql`
  query GetMe($token: String!) {
    me(token: $token) {
      id
      name
      email
      role
      phone
      addresses {
        id
        label
        fullAddress
        isDefault
      }
    }
  }
`;

// ========== ORDER SERVICE QUERIES/MUTATIONS ==========

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($restaurantId: Int!, $addressId: Int!, $items: [OrderItemInput!]!) {
    createOrder(restaurantId: $restaurantId, addressId: $addressId, items: $items) {
      id
      userId
      restaurantId
      status
      totalPrice
      items {
        id
        menuItemName
        quantity
        price
      }
    }
  }
`;

export const GET_MY_ORDERS_QUERY = gql`
  query GetMyOrders {
    myOrders {
      id
      userId
      restaurantId
      status
      totalPrice
    }
  }
`;

export const GET_ORDER_BY_ID_QUERY = gql`
  query GetOrder($id: Int!) {
    order(id: $id) {
      id
      userId
      restaurantId
      status
      totalPrice
      items {
        id
        menuItemName
        quantity
        price
      }
    }
  }
`;

// ========== PAYMENT SERVICE QUERIES/MUTATIONS ==========

export const PAY_ORDER_MUTATION = gql`
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
`;

export const GET_PAYMENT_HISTORY_QUERY = gql`
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
`;
