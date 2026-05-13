FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install

COPY . .

RUN npm install

RUN npm run build

RUN cp -r dist backend/

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "server.js"]