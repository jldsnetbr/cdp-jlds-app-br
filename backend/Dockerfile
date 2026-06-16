FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "backend/server.js"]
