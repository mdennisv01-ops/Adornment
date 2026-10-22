const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = {
  admin: path.join(__dirname, 'client', 'ADMIN'),
  storefront: path.join(__dirname, 'client', 'MAIN'),
};

const PORT = {
  admin: 5500,
  storefront: 5501,
};

const MODE = process.argv[2] || 'storefront';
const targetDir = DIST[MODE];
const port = PORT[MODE];

if (!targetDir) {
  console.error('Usage: node frontend-server.js <admin|storefront>');
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function normalizeUrl(reqUrl) {
  const pathname = decodeURIComponent(new URL(reqUrl, 'http://localhost').pathname);
  if (pathname === '/') {
    return MODE === 'admin' ? '/HTML FOLDER/login.html' : '/HTML FOLDER/clothe-home.html';
  }
  if ((pathname === '/admin' || pathname === '/admin/') && MODE === 'admin') {
    return '/HTML FOLDER/login.html';
  }
  if (pathname === '/storefront' || pathname === '/storefront/') {
    return MODE === 'storefront' ? '/HTML FOLDER/clothe-home.html' : pathname;
  }
  return pathname;
}

const server = http.createServer((req, res) => {
  const safePath = normalizeUrl(req.url);
  const requestedPath = path.normalize(path.join(targetDir, safePath));

  if (!requestedPath.startsWith(targetDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(requestedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(requestedPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(requestedPath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Serving ${MODE} frontend on http://localhost:${port}`);
});
