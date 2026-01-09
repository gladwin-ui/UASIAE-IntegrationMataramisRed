import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "API Gateway (Node.js) is running on port " + PORT });
});

// --- PROXY CONFIGURATION ---

// 1. User Service
// Specific: Integrations (Must come before generic /api/users)
app.use('/api/users/integrations', createProxyMiddleware({
    target: 'http://user-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/users/integrations': '/integrations'
    }
}));

// Generic: Auth and Profiles
app.use('/api/users', createProxyMiddleware({
    target: 'http://user-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/users/auth': '/auth',
        '^/api/users': '/users'
    }
}));

// 2. Restaurant Service
// Frontend sends /api/restaurants -> Python service needs /restaurants
app.use('/api/restaurants', createProxyMiddleware({
    target: 'http://restaurant-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix
    }
}));

// 3. Order Service
// Frontend sends /api/orders -> Python service needs /orders (or /admin/...)
// Based on requirement: /api/orders/admin/sales/statistics -> /orders/admin/sales/statistics
app.use('/api/orders', createProxyMiddleware({
    target: 'http://order-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix
    }
}));

// 4. Payment Service
app.use('/api/payments', createProxyMiddleware({
    target: 'http://payment-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/payments': ''
    }
}));

// 5. Driver Service
app.use('/api/drivers', createProxyMiddleware({
    target: 'http://driver-service:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': ''
    }
}));

// 6. GraphQL Routes for Frontend (/api/graphql/{service})
// Frontend sends /api/graphql/user -> http://user-service:8000/graphql
const graphqlServices = ['user', 'restaurant', 'order', 'payment', 'driver'];
graphqlServices.forEach(service => {
    app.use(`/api/graphql/${service}`, createProxyMiddleware({
        target: `http://${service}-service:8000`,
        changeOrigin: true,
        pathRewrite: {
            [`^/api/graphql/${service}`]: '/graphql'
        }
    }));
});

// 7. GraphQL (Legacy support - /{service}/graphql)
// /{service}/graphql -> http://{service}:8000/graphql
const services = ['user', 'restaurant', 'order', 'payment', 'driver'];
services.forEach(service => {
    app.use(`/${service}/graphql`, createProxyMiddleware({
        target: `http://${service}-service:8000`,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            return '/graphql'; // Rewrite all to /graphql on target
        }
    }));
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
