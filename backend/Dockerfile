FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Add curl for health checks
RUN apk add --no-cache curl

EXPOSE 4000

CMD ["node", "dist/index.js"]
