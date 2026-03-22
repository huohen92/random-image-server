FROM node:14-alpine

WORKDIR /app

# 复制依赖清单并安装
COPY package*.json ./
RUN npm install --production

# 复制应用代码
COPY app.js .

# 创建必要目录（确保容器启动时存在）
RUN mkdir -p images/h images/v public

EXPOSE 5566

CMD ["node", "app.js"]
