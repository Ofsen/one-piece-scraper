FROM node:18-alpine
WORKDIR /app
COPY . /app
RUN apk add chrome 
RUN npm install
ENV NODE_ENV=production
ENV BROWSER_PATH=
CMD ["node", "main.js"]
