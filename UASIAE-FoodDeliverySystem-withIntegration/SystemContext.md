# SYSTEM ARCHITECTURE & CONTEXT

## 1. Project Overview
A microservices-based Food Delivery System orchestrated via Docker Compose.
- **Frontend:** React (Vite) running on Port 80 (Docker) / 5173 (Dev).
- **Gateway:** Express.js (Node.js) acting as a Reverse Proxy.
- **Backend Services:** Python FastAPI.
- **Database:** MySQL (One DB per service).

## 2. Port Configuration (Docker Compose)
| Service | Internal Port | Host Port | Database |
| :--- | :--- | :--- | :--- |
| **API Gateway** | 3000 | **4000** | N/A |
| User Service | 8000 | 4001 | user_service_db |
| Restaurant Service | 8000 | 4002 | restaurant_service_db |
| Order Service | 8000 | 4003 | order_service_db |
| Payment Service | 8000 | 4004 | payment_service_db |
| Driver Service | 8000 | 4005 | driver_service_db |

## 3. Current Integration Logic
The Frontend (`src/services/api.ts`) sends requests to the Gateway (`http://localhost:4000`).
The Gateway (`api-gateway/src/index.ts`) forwards requests to internal service names (e.g., `http://order-service:8000`).

## 4. The Problem
**Endpoint:** `GET http://localhost:4000/api/orders/admin/sales/statistics`
**Error:** 404 Not Found.
**Root Cause:**
1. API Gateway might not be rewriting the path correctly (e.g., passing `/api/orders/...` instead of `/orders/...` or just `...`).
2. Order Service (`app/main.py`) does not have the route `/admin/sales/statistics` implemented.
3. Database is empty, so we need seeders to visualize data on the Dashboard.

## 5. Constraint
- Do NOT change the Frontend code.
- Must use `http-proxy-middleware` in Express Gateway.
- Must provide Python scripts (`seed.py`) to populate initial data using SQLAlchemy models.