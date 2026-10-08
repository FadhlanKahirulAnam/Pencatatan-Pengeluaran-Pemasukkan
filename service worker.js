// Naikkan angka versi ini setiap kali Anda mengubah file aplikasi,
// supaya cache lama diganti dengan yang baru.
const VERSI_CACHE = "pengeluaran-v2";

const FILE_APLIKASI = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Saat pertama dipasang: simpan semua file ke cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSI_CACHE).then((cache) => cache.addAll(FILE_APLIKASI))
  );
  self.skipWaiting();
});

// Saat aktif: hapus cache versi lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((daftarCache) =>
      Promise.all(
        daftarCache
          .filter((nama) => nama !== VERSI_CACHE)
          .map((nama) => caches.delete(nama))
      )
    )
  );
  self.clients.claim();
});

// Saat ada permintaan file: pakai cache dulu, kalau tidak ada baru ke internet
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((hasilCache) => hasilCache || fetch(event.request))
  );
});