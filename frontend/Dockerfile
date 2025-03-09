# Use Node.js as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables to disable caching
ENV NODE_ENV=development
ENV SERVE_OPTS="--no-clipboard --no-compression --cors"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 80

# Start the application with no caching
CMD ["sh", "-c", "node_modules/.bin/serve -s public -l 80 $SERVE_OPTS"]

FROM nginx:alpine
COPY public /usr/share/nginx/html