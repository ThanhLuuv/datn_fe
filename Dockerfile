# Frontend Dockerfile - Static AngularJS SPA
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install http-server
RUN npm install -g http-server

# Copy all files
COPY . .

# Expose port 3002
EXPOSE 3002

# Start http-server
CMD ["http-server", "-p", "3002", "-a", "0.0.0.0", "--cors"]

