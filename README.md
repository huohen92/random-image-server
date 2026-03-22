# Random Image Server 完整部署教程

本文档将指导您使用 Docker 镜像 **huohen92/random-image-server:v0.01** 部署随机图片服务，支持 PC / 移动端自适应展示、图片上传、静态文件托管。

---

## 一、准备工作

### 1️⃣ 安装 Docker

确保系统已安装：

- Docker ≥ 20.10
- Docker Compose ≥ 2.0（可选）

#### Ubuntu 示例

```bash
curl -fsSL https://get.docker.com | bash
sudo systemctl enable docker && sudo systemctl start docker
```

---

### 2️⃣ 创建数据目录

```bash
mkdir -p /opt/random-image
cd /opt/random-image
mkdir -p images/h images/v public
```

目录说明：

- images/h：PC 图片
- images/v：移动端图片
- public：静态文件

---

## 二、拉取镜像

```bash
docker pull huohen92/random-image-server:v0.01
```

---

## 三、部署方式

### 方式一：Docker Run

```bash
docker run -d   --name random-image   -p 5566:5566   -v $(pwd)/images:/app/images   -v $(pwd)/public:/app/public   huohen92/random-image-server:v0.01
```

设置开机自启：

```bash
docker update --restart=unless-stopped random-image
```

---

### 方式二：Docker Compose（推荐）

```yaml
services:
  random-image:
    image: huohen92/random-image-server:v0.01
    container_name: random-image
    ports:
      - "5566:5566"
    volumes:
      - ./images:/app/images
      - ./public:/app/public
    restart: unless-stopped
```

启动：

```bash
docker-compose up -d
```

---

## 四、上传图片

### 网页上传

访问：http://<IP>:5566/upload

### 命令行上传

```bash
curl -F "type=pc" -F "image=@photo.jpg" http://localhost:5566/api/upload
curl -F "type=mobile" -F "image=@photo.jpg" http://localhost:5566/api/upload
```

---

## 五、访问地址

- / ：使用指南
- /random 或 /img ：自适应展示
- /h ：PC 随机图
- /v ：移动端随机图
- /api/random ：API
- /upload ：上传界面
- /xxx.html ：public 静态文件

---

## 六、故障排除

- 404：确保 images 目录内有图片
- 上传失败：检查目录权限
- 端口占用：修改映射端口

---

## 七、停止与删除

```bash
docker stop random-image
docker rm random-image
docker rmi huohen92/random-image-server:v0.01
```

---

## 八、更新镜像

```bash
docker pull huohen92/random-image-server:v0.02
docker stop random-image
docker rm random-image
# 使用新镜像重新运行
```

---

✅ 部署完成，祝您使用愉快！
