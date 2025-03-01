FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Add bcryptjs explicitly
RUN npm install
RUN npm install bcryptjs --save

# Copy application files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]