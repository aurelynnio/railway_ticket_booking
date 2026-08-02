# Build stage (no Prisma — api-gateway proxies to microservices)
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 8080
USER node
CMD ["npm", "run", "start:prod"]
