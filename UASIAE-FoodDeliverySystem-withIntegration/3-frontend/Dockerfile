# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Gunakan install biasa jika npm ci bermasalah dengan versi lock
RUN npm install 
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Pastikan folder build Anda adalah 'dist' (Vite standard)
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy config nginx lama Anda (ini penting agar routing React/Vite tidak 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]