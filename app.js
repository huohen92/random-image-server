const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = 5566;

const VERSION = '0.06';  // 版本号，可自行修改

const SUPPORTED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'];

// 静态文件服务：根路径访问 public 目录
app.use(express.static('public'));
// 额外支持 /public 前缀，方便旧习惯
app.use('/public', express.static('public'));

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
      cb(new Error(`不支持的格式。允许的格式: ${SUPPORTED_EXT.join(', ')}`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ---------- 随机图片函数 ----------
function getRandomImagePath(subdir, callback) {
  const dirPath = path.join(__dirname, 'images', subdir);
  fs.readdir(dirPath, (err, files) => {
    if (err) return callback(err);
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXT.includes(ext);
    });
    if (!images.length) return callback(new Error(`${subdir} 目录中没有图片`));
    const random = images[Math.floor(Math.random() * images.length)];
    callback(null, path.join(dirPath, random));
  });
}

// ---------- 根路径：中文使用指南 ----------
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>随机图片服务 v${VERSION}</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f0f0f0; }
            .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
            ul { list-style: none; padding: 0; }
            li { margin: 10px 0; padding: 8px; background: #f9f9f9; border-left: 4px solid #007bff; }
            code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📸 随机图片服务 v${VERSION}</h1>
            <ul>
                <li><code>/random</code> 或 <code>/img</code> – 自适应展示页面</li>
                <li><code>/h</code> – PC 尺寸随机图片（原始）</li>
                <li><code>/v</code> – 移动端尺寸随机图片（原始）</li>
                <li><code>/api/random</code> – 自动选择图片 API（使用 ?type=pc 或 ?type=mobile）</li>
                <li><code>/upload</code> – 网页上传图片</li>
                <li><code>/api/upload</code> – 上传 API</li>
                <li><code>public/</code> – 静态文件（例如 /index.html 或 /public/index.html）</li>
            </ul>
            <p>请将图片放入 <code>images/h/</code>（PC）和 <code>images/v/</code>（移动端）目录。</p>
            <p>静态文件请放入 <code>public/</code> 目录，可通过 <code>/文件名</code> 或 <code>/public/文件名</code> 访问。</p>
        </div>
    </body>
    </html>
  `);
});

// ---------- 路由：PC 图片 ----------
app.get('/h', (req, res) => {
  getRandomImagePath('h', (err, filePath) => {
    if (err) return res.status(404).send('PC 目录中没有图片');
    res.sendFile(filePath);
  });
});

// ---------- 路由：移动端图片 ----------
app.get('/v', (req, res) => {
  getRandomImagePath('v', (err, filePath) => {
    if (err) return res.status(404).send('移动端目录中没有图片');
    res.sendFile(filePath);
  });
});

// ---------- API：自动选择图片 ----------
app.get('/api/random', (req, res) => {
  const type = req.query.type;
  if (type === 'pc') {
    getRandomImagePath('h', (err, filePath) => {
      if (err) return res.status(404).send('没有图片');
      res.sendFile(filePath);
    });
  } else if (type === 'mobile') {
    getRandomImagePath('v', (err, filePath) => {
      if (err) return res.status(404).send('没有图片');
      res.sendFile(filePath);
    });
  } else {
    const ua = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    const subdir = isMobile ? 'v' : 'h';
    getRandomImagePath(subdir, (err, filePath) => {
      if (err) return res.status(404).send('没有图片');
      res.sendFile(filePath);
    });
  }
});

// ---------- 自适应展示页面（中文）----------
app.get('/random', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>随机图片</title>
        <style>
            body { text-align: center; font-family: Arial; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
            img { max-width: 100%; height: auto; border-radius: 4px; }
            button { margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>随机图片</h1>
            <img id="img" src="/h" alt="随机图片" onerror="handleError()">
            <br><button onclick="refresh()">换一张</button>
            <p id="info"></p>
        </div>
        <script>
            function refresh() {
                const endpoint = window.innerWidth <= 768 ? '/v' : '/h';
                document.getElementById('img').src = endpoint + '?t=' + Date.now();
                document.getElementById('info').innerText = '当前使用：' + (endpoint === '/v' ? '移动端图片' : 'PC端图片');
            }
            function handleError() {
                document.getElementById('info').innerText = '未找到图片，请先上传。';
            }
            window.onload = refresh;
            window.onresize = refresh;
        </script>
    </body>
    </html>
  `);
});
app.get('/img', (req, res) => res.redirect('/random'));

// ---------- 上传页面（中文）----------
app.get('/upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>上传图片</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f5f5f5; }
            .container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
            input, select, button { margin: 10px 0; padding: 8px; width: 100%; box-sizing: border-box; }
            button { background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>上传图片</h1>
            <form id="form" enctype="multipart/form-data">
                <select name="type">
                    <option value="pc">PC 尺寸 (h)</option>
                    <option value="mobile">移动端尺寸 (v)</option>
                </select>
                <input type="file" name="image" accept="image/*" required>
                <button type="submit">上传</button>
            </form>
            <div id="msg"></div>
        </div>
        <script>
            document.getElementById('form').onsubmit = async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                const msg = document.getElementById('msg');
                msg.innerText = res.ok ? '上传成功: ' + data.filename : '错误: ' + data.error;
                msg.style.color = res.ok ? 'green' : 'red';
                if (res.ok) e.target.reset();
            };
        </script>
    </body>
    </html>
  `);
});

// ---------- 上传 API ----------
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ success: true, filename: req.file.filename });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(port, () => {
  console.log(`服务运行在 http://localhost:${port} (v${VERSION})`);
  console.log(`支持的格式: ${SUPPORTED_EXT.join(', ')}`);
});
