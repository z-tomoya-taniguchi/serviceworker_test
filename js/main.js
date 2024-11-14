// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('js/service-worker.js')
//     .then(registration => {
//         console.log('Service Worker registered with scope:', registration.scope);
//     }).catch(error => {
//         console.log('Service Worker registration failed:', error);
//     });
// }


const videoUrl = '/serviceworker_test/assets/movie.mp4';
const dbName = 'VideoCacheDB';

// IndexedDBに接続
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('videos');
        };
    });
}

// 動画をIndexedDBに保存
async function saveVideoToDB(blob) {
    if (!(blob instanceof Blob)) {
        console.error("保存しようとしたデータがBlob形式ではありません");
        return;
    }
    const db = await openDB();
    const tx = db.transaction('videos', 'readwrite');
    const store = tx.objectStore('videos');
    store.put(blob, videoUrl);
    await tx.complete;
    db.close();
}

// 動画をIndexedDBから取得
function getVideoFromDB() {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const tx = db.transaction('videos', 'readonly');
        const store = tx.objectStore('videos');
        const request = store.get(videoUrl);

        request.onsuccess = () => {
            const blob = request.result;
            if (blob && !(blob instanceof Blob)) {
                console.warn("取得したデータがBlob形式ではありません。Blobに変換します。");
                resolve(new Blob([blob], { type: 'video/mp4' }));
            } else {
                resolve(blob);
            }
            db.close();
        };

        request.onerror = () => {
            console.error("IndexedDBからのデータ取得に失敗しました", request.error);
            reject(request.error);
            db.close();
        };
    });
}

// 初回は動画を保存し、2回目以降はIndexedDBから取得
async function cacheVideo() {
    let videoBlob = await getVideoFromDB();
    if (!videoBlob) {
        console.log('初回アクセス - 動画をIndexedDBに保存します');
        const response = await fetch(videoUrl);
        videoBlob = await response.blob();
        await saveVideoToDB(videoBlob);
    } else {
        console.log('IndexedDBから動画を取得');
    }
    return videoBlob;
}

// 動画要素にキャッシュした動画を設定
async function setVideoSource() {
    const videoElement = document.getElementById('video');
    const videoBlob = await cacheVideo();

    // デバッグ用コード: videoBlobが有効か確認
    if (!videoBlob) {
        console.error("動画の取得に失敗しました。IndexedDBから正しいデータが取得できていません。");
        return;
    }

    const videoURL = URL.createObjectURL(videoBlob);
    videoElement.src = videoURL;
}

// ページロード時に動画のソースを設定
window.addEventListener('load', setVideoSource);


function getTotalDataUsage() {
    const entries = performance.getEntriesByType("resource");

    let totalDownloadedBytes = 0;
    let totalUploadedBytes = 0;

    entries.forEach(entry => {
        totalDownloadedBytes += entry.transferSize || 0;  // ダウンロードされたデータサイズ
        totalUploadedBytes += entry.encodedBodySize || 0; // アップロードされたデータサイズ
    });

    // return {
    //     downloaded: totalDownloadedBytes,
    //     uploaded: totalUploadedBytes
    // };

    console.log(totalDownloadedBytes);
}
