// types/index.ts
export interface SpeedPriceData {
    price: number;
    soldDays: number;
    productName: string;
    condition: string;
    image: string;
    listedDate?: string;
    soldDate?: string;
  }
  
  export interface CategoryData {
    category: string;
    soldCount: number;
    listingCount: number;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    avgSoldDays: number;
    priceQuartiles: {
      q1: number;
      median: number;
      q3: number;
    };
    speedPriceData: SpeedPriceData[];
    productNames: string;
  }
  
  export interface Brand {
    code: string;
    brandName_ja: string;
    brandName_en?: string;  // オプショナルに変更
    note?: string;
  }
  
  export interface AnalyticsData extends Brand {
    categories: CategoryData[];
  }