self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open('videocall-v1').then((cache) =>
			cache.addAll(['/', '/manifest.json', '/favicon.svg'])
		)
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
