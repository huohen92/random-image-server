# Random Image Server

一个轻量级随机图片服务，支持 PC / 移动端自适应、网页上传、静态文件托管。

## 功能
- /h – PC 尺寸随机图片
- /v – 移动端尺寸随机图片
- /api/random – 自动选择图片 (?type=pc / mobile)
- /random / /img – 自适应展示页面
- /upload – 网页上传
- / – 使用指南

## 启动
```bash
mkdir -p images/h images/v public
docker-compose up -d
```
访问 http://localhost:8080

## 目录结构
```
.
├── images/h
├── images/v
├── public
├── app.js
├── Dockerfile
└── docker-compose.yml
```

## 许可证
MIT
