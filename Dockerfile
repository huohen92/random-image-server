FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

# 安装生产依赖，并验证 express 是否存在
RUN npm install --production && \
    if [ ! -d node_modules/express ]; then echo "express not installed!" && exit 1; fi

COPY app.js .

RUN mkdir -p images/h images/v public

EXPOSE 5566

CMD ["node", "app.js"]
