'use client';

import { deleteAllLogos, deleteLogo, getAllLogos } from './logoDatabase';
import { bulkUploadLogos } from './bulkUpload';  // このインポートが正しく行われているか確認

// デバッグ用のログを追加
console.log('Imported functions:', {
  bulkUploadLogos: typeof bulkUploadLogos
});

if (typeof window !== 'undefined') {
  // グローバルオブジェクトに関数を直接割り当て
  window.deleteAllLogos = deleteAllLogos;
  window.deleteLogo = deleteLogo;
  window.getAllLogos = getAllLogos;
  window.bulkUploadLogos = bulkUploadLogos;  // ここで登録
  
  console.log('Functions registered to window:', {
    deleteAllLogos: typeof window.deleteAllLogos,
    bulkUploadLogos: typeof window.bulkUploadLogos
  });
}