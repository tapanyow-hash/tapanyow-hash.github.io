const CACHE_NAME = "24game-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./problems.js",
  "./math.png",
  "./short1920x1080.png",
  "./icon.png",
  "./manifest.json",
  "./NotoSansMono-VariableFont_wdth,wght.ttf"
];

// ติดตั้ง Service Worker และ cache ไฟล์
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ทำงานแบบ offline-first
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// ลบ cache เก่าถ้ามี
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
