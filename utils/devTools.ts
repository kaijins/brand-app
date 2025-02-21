'use client';

import { deleteAllLogos, deleteLogo, getAllLogos, LogoData } from './logoDatabase';

declare global {
  interface Window {
    deleteAllLogos: typeof deleteAllLogos;
    deleteLogo: typeof deleteLogo;
    getAllLogos: typeof getAllLogos;
  }
}

if (typeof window !== 'undefined') {
  window.deleteAllLogos = deleteAllLogos;
  window.deleteLogo = deleteLogo;
  window.getAllLogos = getAllLogos;
}