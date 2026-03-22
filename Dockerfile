FROM node:14-alpine

WORKDIR /app

# 复制依赖清单
COPY package*.json ./

# 安装依赖（--production 只安装生产依赖，但为了调试可以去掉）
RUN npm install --production

# 复制应用代码
COPY app.js .

# 创建必要目录
RUN mkdir -p images/h images/v public

EXPOSE 5566

CMD ["node", "app.js"]
