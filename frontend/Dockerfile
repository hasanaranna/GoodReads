# Use official Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your code
COPY . .

# Expose port 5173
EXPOSE 5173

# Start the development server by default (can be overridden)
CMD ["npm", "run", "dev"]