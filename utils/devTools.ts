'use client';

import { deleteAllLogos, deleteLogo, getAllLogos } from './logoDatabase';

if (typeof window !== 'undefined') {
  // グローバルオブジェクトに関数を直接割り当て
  window.deleteAllLogos = deleteAllLogos;
  window.deleteLogo = deleteLogo;
  window.getAllLogos = getAllLogos;
  
}