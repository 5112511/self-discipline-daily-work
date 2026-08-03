// Personal OS Service Worker - 离线可用 + 静态资源缓存
const CACHE = 'personal-os-v1';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // 只处理 GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 不缓存后端 API（热点抓取）和跨域请求
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 静态资源（/assets/）走缓存优先
  if (url.pathname.startsWith('/assets/') || /\.(?:js|css|png|jpg|svg|webp|ico|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 导航请求（HTML）：网络优先，失败回退缓存，最后回退离线页
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('/index.html')))
    );
    return;
  }
});
