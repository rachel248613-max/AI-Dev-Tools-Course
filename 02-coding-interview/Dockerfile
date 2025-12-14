# Build Stage for Client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production Stage for Server
FROM node:20-alpine
WORKDIR /app

# Copy server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy built frontend assets from client-build stage
COPY --from=client-build /app/client/dist ../client/dist

# Expose server port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
