# Frontend (Vite React) Dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source
COPY . .

# Allow passing API base URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build static site
RUN npm run build

# Serve via nginx
FROM nginx:alpine
# SPA fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Static assets
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
