// ===== 牛奶抗生素检测 PWA — Service Worker =====
// 缓存策略: Cache First（缓存优先）
// 首次访问缓存所有静态资源，后续离线可用

const CACHE_NAME = 'antibiotic-detection-v1';
const CACHE_URLS = [
    '/',
    'index.html',
    'manifest.json',
    'css/style.css',
    'js/app.js',
    'js/camera.js',
    'js/color-analyzer.js',
    'js/antibiotic-db.js',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

// ===== 安装事件: 预缓存所有核心资源 =====
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] Caching core resources');
            return cache.addAll(CACHE_URLS).catch(function(err) {
                console.warn('[SW] Some resources failed to cache:', err);
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// ===== 激活事件: 清理旧版本缓存 =====
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// ===== 请求拦截: Cache First 策略 =====
self.addEventListener('fetch', function(event) {
    // 跳过非 GET 请求和浏览器扩展请求
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {
            if (cachedResponse) {
                // 缓存命中，直接返回
                return cachedResponse;
            }
            // 缓存未命中，发起网络请求并动态缓存
            return fetch(event.request).then(function(response) {
                // 只缓存成功的响应
                if (!response || response.status !== 200) {
                    return response;
                }
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            }).catch(function() {
                // 网络失败时，对于导航请求返回首页
                if (event.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
                // 其他请求静默失败
                return new Response('', { status: 408, statusText: 'Offline' });
            });
        })
    );
});
