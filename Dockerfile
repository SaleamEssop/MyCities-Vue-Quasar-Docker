FROM node:18-alpine

# Install required packages
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies including Quasar CLI globally
RUN npm install -g @quasar/cli && npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Start development server
CMD ["npx", "quasar", "dev", "--hostname", "0.0.0.0", "--port", "8080"]

