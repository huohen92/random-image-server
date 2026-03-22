const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = 5566;

const VERSION = '0.01';

const SUPPORTED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'];

// 静态文件服务
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
      cb(new Error(`Unsupported format. Allowed: ${SUPPORTED_EXT.join(', ')}`));
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
    if (!images.length) return callback(new Error(`No images in ${subdir}`));
    const random = images[Math.floor(Math.random() * images.length)];
    callback(null, path.join(dirPath, random));
  });
}

// ---------- 路由 ----------
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Random Image Server v${VERSION}</title>
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
            <h1>📸 Random Image Server v${VERSION}</h1>
            <ul>
                <li><code>/random</code> or <code>/img</code> – Adaptive UI page</li>
                <li><code>/h</code> – Random PC image (original)</li>
                <li><code>/v</code> – Random mobile image (original)</li>
                <li><code>/api/random</code> – Auto image API (use ?type=pc or ?type=mobile)</li>
                <li><code>/upload</code> – Upload images via web</li>
                <li><code>/api/upload</code> – Upload API</li>
                <li><code>public/</code> – Static files (e.g., /index.html)</li>
            </ul>
            <p>Place images in <code>images/h/</code> (PC) and <code>images/v/</code> (mobile).</p>
        </div>
    </body>
    </html>
  `);
});

app.get('/h', (req, res) => {
  getRandomImagePath('h', (err, filePath) => {
    if (err) return res.status(404).send('No images in /h');
    res.sendFile(filePath);
  });
});

app.get('/v', (req, res) => {
  getRandomImagePath('v', (err, filePath) => {
    if (err) return res.status(404).send('No images in /v');
    res.sendFile(filePath);
  });
});

app.get('/api/random', (req, res) => {
  const type = req.query.type;
  if (type === 'pc') {
    getRandomImagePath('h', (err, filePath) => {
      if (err) return res.status(404).send('No images');
      res.sendFile(filePath);
    });
  } else if (type === 'mobile') {
    getRandomImagePath('v', (err, filePath) => {
      if (err) return res.status(404).send('No images');
      res.sendFile(filePath);
    });
  } else {
    const ua = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    const subdir = isMobile ? 'v' : 'h';
    getRandomImagePath(subdir, (err, filePath) => {
      if (err) return res.status(404).send('No images');
      res.sendFile(filePath);
    });
  }
});

// 自适应页面
app.get('/random', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Random Image</title>
        <style>
            body { text-align: center; font-family: Arial; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
            img { max-width: 100%; height: auto; border-radius: 4px; }
            button { margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Random Image</h1>
            <img id="img" src="/h" alt="random image" onerror="handleError()">
            <br><button onclick="refresh()">Refresh</button>
            <p id="info"></p>
        </div>
        <script>
            function refresh() {
                const endpoint = window.innerWidth <= 768 ? '/v' : '/h';
                document.getElementById('img').src = endpoint + '?t=' + Date.now();
                document.getElementById('info').innerText = 'Using: ' + (endpoint === '/v' ? 'mobile' : 'PC');
            }
            function handleError() {
                document.getElementById('info').innerText = 'No images found. Please upload some.';
            }
            window.onload = refresh;
            window.onresize = refresh;
        </script>
    </body>
    </html>
  `);
});
app.get('/img', (req, res) => res.redirect('/random'));

// 上传页面
app.get('/upload', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Upload Image</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f5f5f5; }
            .container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
            input, select, button { margin: 10px 0; padding: 8px; width: 100%; box-sizing: border-box; }
            button { background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Upload Image</h1>
            <form id="form" enctype="multipart/form-data">
                <select name="type">
                    <option value="pc">PC (h)</option>
                    <option value="mobile">Mobile (v)</option>
                </select>
                <input type="file" name="image" accept="image/*" required>
                <button type="submit">Upload</button>
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
                msg.innerText = res.ok ? 'Uploaded: ' + data.filename : 'Error: ' + data.error;
                msg.style.color = res.ok ? 'green' : 'red';
                if (res.ok) e.target.reset();
            };
        </script>
    </body>
    </html>
  `);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, filename: req.file.filename });
});

// 错误处理
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port} (v${VERSION})`);
  console.log(`Supported formats: ${SUPPORTED_EXT.join(', ')}`);
});
