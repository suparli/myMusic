# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Production API URL (same origin since we're consolidating)
ENV VITE_API_URL=/
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine as backend-build
RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# Stage 3: Final Production Image
FROM node:18-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules

# Copy frontend build to the backend's static folder
COPY --from=frontend-build /app/frontend/dist ./client

# Environment variables
ENV PORT=3000
ENV LIBRARY_PATH=/library

EXPOSE 3000

# Start from the backend
WORKDIR /app/backend
CMD ["npm", "run", "start:prod"]
