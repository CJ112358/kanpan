/* 量化看盘 · 最简 Service Worker
   唯一目的：让安卓 Chrome 把本站认成「可安装的 PWA」（WebAPK），
   这样主屏图标才会用 manifest 里的图标，而不是 favicon 或网页截图。
   策略：HTML 走网络优先，只在断网时才用缓存兜底，避免以后改了页面看不到新版。 */

var CACHE = "kanpan-shell-v3";
var SHELL = "./index.html";

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add(SHELL); }).catch(function () {}));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // 页面导航：网络优先，断了才回缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(SHELL, copy); }).catch(function () {});
        return r;
      }).catch(function () { return caches.match(SHELL); })
    );
  }
});
