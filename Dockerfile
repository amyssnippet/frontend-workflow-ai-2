# Use official lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the app
RUN npm run build

# Expose port (change as relevant)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
