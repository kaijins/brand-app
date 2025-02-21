// types/global.d.ts
export {};

declare global {
  interface Window {
    deleteAllLogos: () => Promise<boolean>;  // trueを返すように定義されている
    deleteLogo: (id: string) => Promise<boolean>;  // trueを返すように定義されている
    getAllLogos: () => Promise<LogoData[]>;  // LogoData[]を返す
  }
}

// LogoDataインターフェースも必要
interface LogoData {
  id: string;
  brandName: string;
  brandCode: string;
  imageData: string;
  uploadDate: string;
}