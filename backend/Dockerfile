# Use a specific Node version
FROM node:18-alpine

# Install build dependencies for native modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port NestJS runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
