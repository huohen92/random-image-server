const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = 5566;

// 版本号
const VERSION = '0.01';

// 支持的图片扩展名
const SUPPORTED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'];

// 静态文件服务 – 提供 public 目录中的 HTML 文件
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ---------- 文件上传配置 ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type === 'mobile' ? 'v' : 'h';
    const uploadDir = path.join(__dirname, 'images', type);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    let filename = file.originalname;
    const targetPath = path.join(
      __dirname,
      'images',
      req.body.type === 'mobile' ? 'v' : 'h',
      filename
    );
    if (fs.existsSync(targetPath)) {
      filename = `${baseName}_${Date.now()}${ext}`;
    }
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SUPPORTED_EXT.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件格式，仅支持 ${SUPPORTED_EXT.join(', ')}`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ---------- 核心函数：获取随机图片路径 ----------
function getRandomImagePath(subdir, callback) {
  const dirPath = path.join(__dirname, 'images', subdir);
  fs.readdir(dirPath, (err, files) => {
    if (err) return callback(err);
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXT.includes(ext);
    });
    if (!images.length) return callback(new Error(`No supported images in ${subdir}`));
    const random = images[Math.floor(Math.random() * images.length)];
    callback(null, path.join(dirPath, random));
  });
}

// ---------- 根路径：使用指南 ----------
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>随机图片服务 v${VERSION} - 使用指南</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; text-align: center; }
            .container { max-width: 800px; margin: auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: left; }
            h1 { color: #333; }
            .version { color: #666; font-size: 14px; margin-top: -10px; margin-bottom: 20px; }
            ul { list-style: none; padding: 0; }
            li { margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #007bff; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .public-note { background: #fff3cd; border-left-color: #ffc107; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📸 随机图片服务</h1>
            <div class="version">版本 ${VERSION}</div>
            <p>欢迎使用随机图片服务。以下为可用的访问路径：</p>
            <ul>
                <li><strong><code>/random</code></strong> 或 <strong><code>/img</code></strong><br>自适应UI页面：根据屏幕宽度自动选择PC或移动端图片，支持刷新按钮。</li>
                <li><strong><code>/h</code></strong><br>直接返回PC尺寸随机图片（原始文件）。</li>
                <li><strong><code>/v</code></strong><br>直接返回移动端尺寸随机图片（原始文件）。</li>
                <li><strong><code>/api/random</code></strong><br>API接口：根据User-Agent自动返回PC或移动端随机图片（纯图片）。<br>可通过 <code>?type=pc</code> 或 <code>?type=mobile</code> 强制指定类型。</li>
                <li class="public-note"><strong>📄 静态文件服务</strong><br>将 HTML、CSS、JS 等文件放入 <code>public/</code> 目录，即可通过 <code>http://&lt;IP&gt;:8080/文件名</code> 直接访问。<br>例如：<code>http://&lt;IP&gt;:8080/index.html</code> 会显示 <code>public/index.html</code> 的内容。</li>
            </ul>
            <p>💡 提示：请确保 <code>images/h</code> 和 <code>images/v</code> 目录中有支持的图片文件（.jpg, .png, .webp 等）。</p>
            <p>🔧 服务状态：运行中</p>
        </div>
    </body>
    </html>
  `);
});

// ---------- 路由：/h (PC端图片) ----------
app.get('/h', (req, res) => {
  getRandomImagePath('h', (err, filePath) => {
    if (err) {
      console.error(err);
      return res.status(404).send('No images found in /h');
    }
    res.sendFile(filePath);
  });
});

// ---------- 路由：/v (移动端图片) ----------
app.get('/v', (req, res) => {
  getRandomImagePath('v', (err, filePath) => {
    if (err) {
      console.error(err);
      return res.status(404).send('No images found in /v');
    }
    res.sendFile(filePath);
  });
});

// ---------- API：/api/random (自动选择尺寸的纯图片) ----------
app.get('/api/random', (req, res) => {
  // 优先使用 type 参数
  let type = req.query.type;
  if (type && (type === 'pc' || type === 'mobile')) {
    const subdir = type === 'pc' ? 'h' : 'v';
    getRandomImagePath(subdir, (err, filePath) => {
      if (err) {
        console.error(err);
        return res.status(404).send('No images found');
      }
      res.sendFile(filePath);
    });
    return;
  }

  // 否则根据 User-Agent 判断
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const subdir = isMobile ? 'v' : 'h';

  getRandomImagePath(subdir, (err, filePath) => {
    if (err) {
      console.error(err);
      return res.status(404).send('No images found');
    }
    res.sendFile(filePath);
  });
});

// ---------- 自适应 UI 页面 ----------
function getAdaptivePage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>随机图片 - 自适应展示</title>
        <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; text-align: center; }
            .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; }
            img { max-width: 100%; height: auto; border-radius: 4px; margin-top: 10px; }
            button { margin-top: 20px; padding: 10px 24px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #0056b3; }
            .info { margin-top: 20px; font-size: 14px; color: #666; }
            .error { color: red; margin-top: 20px; display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📸 随机图片展示</h1>
            <p id="deviceHint">正在检测设备...</p>
            <img id="randomImage" alt="随机图片" onerror="handleImageError()">
            <br>
            <button onclick="refreshImage()">🎲 换一张</button>
            <div class="info">
                根据屏幕宽度自动选择图片：<br>
                <span id="currentSource"></span>
            </div>
            <div id="errorMsg" class="error"></div>
        </div>

        <script>
            function getImageEndpoint() {
                return window.innerWidth <= 768 ? '/v' : '/h';
            }

            function handleImageError() {
                const errorDiv = document.getElementById('errorMsg');
                errorDiv.style.display = 'block';
                errorDiv.innerHTML = '❌ 图片加载失败，可能该目录没有图片或图片格式不支持。请检查服务器图片目录。';
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 3000);
            }

            function refreshImage() {
                const endpoint = getImageEndpoint();
                const img = document.getElementById('randomImage');
                const errorDiv = document.getElementById('errorMsg');
                errorDiv.style.display = 'none';
                img.src = endpoint + '?t=' + new Date().getTime();
                document.getElementById('currentSource').innerHTML = 
                    '当前使用：' + (endpoint === '/v' ? '移动端图片 (/v)' : 'PC 端图片 (/h)');
            }

            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    refreshImage();
                }, 200);
            });

            window.onload = () => {
                refreshImage();
                const isMobile = window.innerWidth <= 768;
                document.getElementById('deviceHint').innerHTML = 
                    isMobile ? '📱 检测到移动设备，自动使用移动端图片' : '💻 检测到 PC 设备，自动使用 PC 端图片';
            };
        </script>
    </body>
    </html>
  `;
}

app.get('/random', (req, res) => {
  res.send(getAdaptivePage());
});

app.get('/img', (req, res) => {
  res.send(getAdaptivePage());
});

// ---------- 上传管理页面 ----------
app.get('/upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>图片上传管理</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            input, select, button { margin: 10px 0; padding: 8px; width: 100%; box-sizing: border-box; }
            button { background: #007bff; color: white; border: none; cursor: pointer; }
            button:hover { background: #0056b3; }
            .message { margin-top: 10px; padding: 10px; border-radius: 4px; display: none; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📤 上传图片</h1>
            <form id="uploadForm" enctype="multipart/form-data">
                <label>选择目标目录：</label>
                <select name="type">
                    <option value="pc">PC 尺寸 (h)</option>
                    <option value="mobile">移动端尺寸 (v)</option>
                </select>
                <label>选择图片文件：</label>
                <input type="file" name="image" accept="image/*" required>
                <button type="submit">上传</button>
            </form>
            <div id="message" class="message"></div>
            <p><a href="/">返回首页</a></p>
        </div>
        <script>
            document.getElementById('uploadForm').onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                const msgDiv = document.getElementById('message');
                msgDiv.style.display = 'block';
                if (response.ok) {
                    msgDiv.className = 'message success';
                    msgDiv.innerHTML = '✅ 上传成功！<br>文件名：' + result.filename;
                    e.target.reset();
                } else {
                    msgDiv.className = 'message error';
                    msgDiv.innerHTML = '❌ 上传失败：' + (result.error || '未知错误');
                }
            };
        </script>
    </body>
    </html>
  `);
});

// ---------- 上传 API ----------
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未选择文件' });
  }
  res.json({ success: true, filename: req.file.filename });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// 启动服务
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port} (v${VERSION})`);
  console.log(`Supported image formats: ${SUPPORTED_EXT.join(', ')}`);
  console.log('Endpoints:');
  console.log('  /            - 使用指南');
  console.log('  /h          - PC尺寸随机图片（原始）');
  console.log('  /v          - 移动端尺寸随机图片（原始）');
  console.log('  /api/random - 自动根据User-Agent返回PC/移动端图片（纯图片）');
  console.log('  /random     - 自适应UI页面');
  console.log('  /img        - 自适应UI页面（别名）');
  console.log('  /upload     - 上传管理页面');
  console.log('  /api/upload - 上传API');
  console.log('  public/     - 静态文件目录');
});