// 水表抄表计费工具 - Service Worker
// 缓存优先策略，支持离线使用
var CACHE_NAME = 'water-meter-v1';
var APP_FILE = 'index.html';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.add(APP_FILE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // 只处理同源请求
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // 只缓存成功响应
        if (response.status === 200) {
          var respClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, respClone);
          });
        }
        return response;
      }).catch(function() {
        // 网络失败时，返回缓存中的主页
        if (e.request.mode === 'navigate') {
          return caches.match(APP_FILE);
        }
      });
    })
  );
});
