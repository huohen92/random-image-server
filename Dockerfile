FROM node:14-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装生产依赖（使用国内镜像提高稳定性）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production

# 复制应用代码
COPY app.js .

# 创建必要目录（容器启动时占位）
RUN mkdir -p images/h images/v public

EXPOSE 5566

CMD ["node", "app.js"]
