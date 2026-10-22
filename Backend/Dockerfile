FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads
EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "src/server.js"]
