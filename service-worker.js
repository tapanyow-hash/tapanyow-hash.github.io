const CACHE_NAME = "24game-cache-v2";
const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./problems.js",
    "./math.png",
    "./short1920x1080.png",
    "./iPad-Mini.png",
    "./icon.png",
    "./manifest.json",
    "./NotoSansMono-VariableFont_wdth,wght.ttf"
];

// ติดตั้ง Service Worker และ pre-cache ไฟล์ทั้งหมด
self.addEventListener("install", event => {
    console.log("Service Worker installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Cache opened, pre-caching essential files including problems.js.");
            return cache.addAll(urlsToCache);
        })
    );
    // เพิ่ม self.skipWaiting() เพื่อให้ Service Worker ใหม่ทำงานทันที
    self.skipWaiting();
});

// จัดการการดึงไฟล์
self.addEventListener("fetch", event => {
    const { request } = event;

    // กลยุทธ์สำหรับ problems.js: "Network-First with Cache Update"
    // พยายามดึงจากเครือข่ายก่อนเสมอ, อัปเดตแคชหากมีการเปลี่ยนแปลง
    if (request.url.includes('/problems.js')) {
        event.respondWith(
            (async () => {
                try {
                    // พยายามดึงจากเครือข่ายก่อนเสมอ
                    const responseFromNetwork = await fetch(request);
                    // หากดึงจากเครือข่ายสำเร็จ ให้นำไปเก็บในแคช (จะอัปเดตอัตโนมัติหากมีการเปลี่ยนแปลง)
                    const clonedResponse = responseFromNetwork.clone();
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, clonedResponse);
                    console.log('problems.js fetched from network and updated in cache.');
                    return responseFromNetwork;
                } catch (error) {
                    // หากดึงจากเครือข่ายล้มเหลว (เช่น ไม่มีเน็ต) ให้ลองดึงจากแคชแทน
                    console.log('Network failed for problems.js, serving from cache.');
                    const responseFromCache = await caches.match(request);
                    return responseFromCache;
                }
            })()
        );
    } else {
        // สำหรับไฟล์อื่น ๆ ให้ใช้กลยุทธ์ "Cache first"
        event.respondWith(
            caches.match(request).then(responseFromCache => {
                return responseFromCache || fetch(request);
            })
        );
    }
});

// ลบ cache เก่าถ้ามี
self.addEventListener("activate", event => {
    console.log("Service Worker activating...");
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
});