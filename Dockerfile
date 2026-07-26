# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package files and install only prod dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create downloads directory
RUN mkdir -p downloads && chown -R node:node downloads

# Switch to non-root user for security
USER node

EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
