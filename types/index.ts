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

  export interface CategoryStats {
    category: string;
    count: number;
    averageRevenue: number;
    percentage: number;
    percentageChange?: number;  // オプショナルとして追加
    avgPrice?: number;         // オプショナルとして追加
  }
  
  export interface Brand {
    code: string;
    brandName_ja: string;
    brandName_en?: string;  // オプショナルに変更
    note?: string;
    parent?: string;
  }

  export interface MonthlyStats {
    month: number;
    averagePrice: number;
    itemCount: number;
    categories: CategoryStats[];
    soldTimes?: string[];  // 追加
  }
  
  export interface PriceRangeAnalysis {
    [key: string]: {
      count: number;
      avgDays: number;
    };
  }
  
  export interface ImageAnalysis {
    avgPrice: number;
    avgDays: number;
    count: number;
  }
  
  export interface AnalyticsData extends Brand {
    categories: CategoryData[];  // 既存のプロパティ
    monthlyStats: MonthlyStats[];
    priceRangeAnalysis: PriceRangeAnalysis;
    imageAnalysis: {
      withImage: ImageAnalysis;
      withoutImage: ImageAnalysis;
    };
    totalDataCount: number;
  }

  export interface TimeAnalysisData {
    dayOfWeek: { [key: string]: number };
    hourOfDay: { [key: string]: number };
    heatmap: Array<{
      day: string;
      hour: number;
      count: number;
    }>;
  }