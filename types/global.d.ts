// types/global.d.ts
export {};  // これでモジュールとして認識される

declare global {
  interface Window {
    deleteAllLogos: () => Promise<void>;
    deleteLogo: (id: string) => Promise<void>;
    getAllLogos: () => Promise<any[]>;
  }
}