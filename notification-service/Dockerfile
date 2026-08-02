# Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
USER node
CMD ["npm", "run", "start:prod"]
