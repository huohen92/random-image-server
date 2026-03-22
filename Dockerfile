FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY app.js .
RUN mkdir -p images/h images/v public
EXPOSE 5566
CMD ["node", "app.js"]