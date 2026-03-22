FROM node:14-alpine

WORKDIR /app

# 复制依赖清单
COPY package*.json ./

# 安装生产依赖（包括 express 和 multer）
RUN npm install --production

# 复制应用代码
COPY app.js .

# 创建必要目录（镜像中占位，实际数据由挂载卷提供）
RUN mkdir -p images/h images/v public

EXPOSE 5566

CMD ["node", "app.js"]
