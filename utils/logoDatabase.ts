// utils/logoDatabase.ts
const DB_NAME = 'BrandLogoDB';
const STORE_NAME = 'logos';
const DB_VERSION = 1;

export interface LogoData {
    id: string;
    brandName: string;
    brandCode: string;
    imageData: string;
    uploadDate: string;
  }

// DBの初期化
export async function initDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('brandName', 'brandName', { unique: false });
      }
    };
  });
}

export async function deleteAllLogos() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
  
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  
  export async function deleteLogo(id: string) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
  
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 開発用の管理ツールとして、ブラウザのコンソールで以下のように使用可能
  window.deleteAllLogos = deleteAllLogos;
  window.deleteLogo = deleteLogo;
  window.getAllLogos = getAllLogos;

// ロゴの保存
export async function saveLogo(logo: LogoData) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(logo);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 全ロゴの取得
export async function getAllLogos(): Promise<LogoData[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}