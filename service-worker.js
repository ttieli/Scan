// Service Worker for QR Data Transfer System
// Version: 1.0.0

const CACHE_NAME = 'qr-transfer-v1.1';

// 检测是否在GitHub Pages上运行
const isGitHubPages = self.location.hostname === 'ttieli.github.io';
const basePath = isGitHubPages ? '/Scan' : '';

const urlsToCache = [
  basePath + '/',
  basePath + '/index.html',
  basePath + '/sender.html',
  basePath + '/receiver.html',
  basePath + '/test.html',
  basePath + '/test-advanced.html',
  basePath + '/manifest.json',
  basePath + '/config.js',
  'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[ServiceWorker] Cache failed:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// 获取事件 - 提供缓存内容
self.addEventListener('fetch', event => {
  // 跳过非GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，返回缓存
        if (response) {
          console.log('[ServiceWorker] Found in cache:', event.request.url);
          return response;
        }

        // 否则，进行网络请求
        console.log('[ServiceWorker] Fetching:', event.request.url);
        return fetch(event.request).then(response => {
          // 检查是否是有效的响应
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          // 克隆响应，因为响应流只能使用一次
          const responseToCache = response.clone();

          // 将新资源添加到缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              // 只缓存同源资源和CDN资源
              if (event.request.url.startsWith(self.location.origin) ||
                  event.request.url.includes('cdn.jsdelivr.net')) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(error => {
        console.error('[ServiceWorker] Fetch failed:', error);
        // 离线时返回离线页面
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// 消息事件 - 处理来自页面的消息
self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[ServiceWorker] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// 后台同步事件（可选功能）
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // 这里可以实现数据同步逻辑
      Promise.resolve()
    );
  }
});

// 推送通知事件（可选功能）
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const title = 'QR数据传输';
  const options = {
    body: event.data ? event.data.text() : '有新的数据待接收',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: '打开',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/receiver.html')
    );
  }
});