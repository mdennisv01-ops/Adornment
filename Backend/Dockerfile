FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

RUN mkdir -p uploads
EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
