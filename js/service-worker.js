// キャッシュ名とキャッシュするファイルのリスト
const CACHE_NAME = 'video-cache-v1';
const FILES_TO_CACHE = [
    '/serviceworker_test/assets/movie.mp4',  // キャッシュする動画ファイルのパス
];

// インストールイベントでキャッシュを作成
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('キャッシュを作成しています');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// リクエストが発生した際にキャッシュから応答する
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                // キャッシュが見つかった場合、キャッシュを返す
                console.log('キャッシュから取得:', event.request.url);
                return response;
            }
            // キャッシュがない場合はネットワークから取得
            console.log('ネットワークから取得:', event.request.url);
            return fetch(event.request);
        })
    );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (CACHE_NAME !== cacheName) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
