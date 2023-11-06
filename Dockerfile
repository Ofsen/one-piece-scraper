
FROM node:18-alpine
WORKDIR /app
COPY . /app
RUN npm install
ENV NODE_ENV=production
CMD ["node", "main.js"]
