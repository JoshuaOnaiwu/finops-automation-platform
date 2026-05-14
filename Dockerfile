# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


FROM node:20-alpine AS runtime

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm ci --production

COPY backend/ .

COPY --from=frontend-build /app/frontend/dist ./dist

WORKDIR /app
COPY data ./data

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "server.js"]