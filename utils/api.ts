'use client';

const API_URL = 'https://script.google.com/macros/s/AKfycbyBWUr7pBVFSX8qFPF10WLbautNdf1XQ0_Afn4kIenWtJeOACEZWJTa1xebEtcKv0UJ/exec';

const CACHE_KEYS = {
  BRANDS: 'brandsCache',
  BRAND_ANALYTICS: 'brandAnalyticsCache_',
  EXPIRY: {
    BRANDS: 'brandsCacheExpiry',
    ANALYTICS: 'analyticsExpiry_'
  }
};

const CACHE_DURATION = {
  BRANDS: 24 * 60 * 60 * 1000,    // 24時間
  ANALYTICS: 30 * 60 * 1000       // 30分
};

// パフォーマンスモニタリング用のユーティリティ
const performanceMonitor = {
  start: (operation: string) => {
    const startTime = performance.now();
    return {
      end: () => {
        if (process.env.NODE_ENV === 'development') {
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
          return duration;
        }
      }
    };
  },
  logDataSize: (data: any, operation: string) => {
    if (process.env.NODE_ENV === 'development') {
      const size = new Blob([JSON.stringify(data)]).size;
      console.log(`[Data Size] ${operation}: ${(size / 1024).toFixed(2)}KB`);
      return size;
    }
  }
};

// キャッシュのヘルパー関数
const isCacheValid = (expiryKey: string) => {
  const expiry = localStorage.getItem(expiryKey);
  console.log('Cache expiry check:', {
    expiryKey,
    expiry,
    now: Date.now(),
    isValid: expiry && Date.now() < Number(expiry)
  });
  return expiry && Date.now() < Number(expiry);
};

const getAnalyticsFromCache = (brandCode: string) => {
  try {
    if (isCacheValid(CACHE_KEYS.EXPIRY.ANALYTICS + brandCode)) {
      const cachedData = localStorage.getItem(CACHE_KEYS.BRAND_ANALYTICS + brandCode);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setAnalyticsCache = (brandCode: string, data: any) => {
  try {
    localStorage.setItem(CACHE_KEYS.BRAND_ANALYTICS + brandCode, JSON.stringify(data));
    localStorage.setItem(
      CACHE_KEYS.EXPIRY.ANALYTICS + brandCode,
      String(Date.now() + CACHE_DURATION.ANALYTICS)
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// デフォルトデータを返す関数
const getDefaultAnalyticsData = () => ({
  categories: [{
    category: '全カテゴリー',
    soldCount: 0,
    listingCount: 0,
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    avgSoldDays: 0,
    priceQuartiles: { q1: 0, median: 0, q3: 0 },
    speedPriceData: []
  }]
});

// エクスポートする関数群
export const getAllBrands = async () => {
  const monitor = performanceMonitor.start('getAllBrands');
  try {
    const response = await fetch(`${API_URL}?action=search&query=`);
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const data = JSON.parse(text.substring(jsonStart));
    
    if (data.data) {
      // キャッシュの保存を確実に
      localStorage.setItem(CACHE_KEYS.BRANDS, JSON.stringify(data.data));
      localStorage.setItem(
        CACHE_KEYS.EXPIRY.BRANDS,
        String(Date.now() + CACHE_DURATION.BRANDS)
      );
      console.log('Cache updated:', {
        dataSize: data.data.length,
        expiry: new Date(Date.now() + CACHE_DURATION.BRANDS)
      });
    }
    
    monitor.end();
    return data.data || [];
  } catch (error) {
    console.error('API Error:', error);
    monitor.end();
    return [];
  }
};

export const getBrandAnalytics = async (brandCode: string) => {
  try {
    // ここでURLパラメータを変更
    const url = `${API_URL}?action=analytics&brandName=${encodeURIComponent(brandCode)}`;
    console.log('Analytics request preparation:', {
      original: brandCode,
      encoded: encodeURIComponent(brandCode),
      url: url
    });

    const cachedData = getAnalyticsFromCache(brandCode);
    if (cachedData) {
      performanceMonitor.logDataSize(cachedData, `Cache hit for ${brandCode}`);
      return cachedData;
    }

    console.log('Final request URL:', url);
    console.log('Fetching analytics for:', brandCode);
    const response = await fetch(url);  // 新しいURLを使用
    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const analyticsData = JSON.parse(text.substring(jsonStart));

    if (analyticsData.data && !analyticsData.data.error) {
      performanceMonitor.logDataSize(analyticsData.data, `API data for ${brandCode}`);
      setAnalyticsCache(brandCode, analyticsData.data);
      return analyticsData.data;
    }
    
    return getDefaultAnalyticsData();
  } catch (error) {
    console.error('Analytics Error:', error);
    return getDefaultAnalyticsData();
  }
};

export const searchBrandsBasic = async (query: string) => {
  const monitor = performanceMonitor.start(`searchBrandsBasic(${query})`);
  
  try {
    // キャッシュの取得を確認するデバッグログ
    console.log('Cache status:', {
      cachedData: localStorage.getItem(CACHE_KEYS.BRANDS) ? 'exists' : 'none',
      cacheExpiry: localStorage.getItem(CACHE_KEYS.EXPIRY.BRANDS)
    });

    const cachedData = localStorage.getItem(CACHE_KEYS.BRANDS);
    const cacheExpiry = localStorage.getItem(CACHE_KEYS.EXPIRY.BRANDS);
    const isValid = cacheExpiry && Date.now() < Number(cacheExpiry);

    let brands = [];
    if (isValid && cachedData) {
      console.log('Using cached data');
      brands = JSON.parse(cachedData);
    } else {
      console.log('Fetching new data');
      brands = await getAllBrands();
    }

    console.log('Brands data:', {
      total: brands.length,
      sample: brands.slice(0, 3)  // 最初の3件を表示
    });

    // 検索処理
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // api.ts の searchBrandsBasic 内の検索ロジックを修正
    const results = brands.filter(brand => {
      const brandNameJa = brand.brandName_ja.toLowerCase();
      const brandNameEn = (brand.brandName_en || '').toLowerCase(); // 空文字列をデフォルトに
      const code = brand.code.toLowerCase();
      
      return (
        brandNameJa.includes(normalizedQuery) ||
        (brandNameEn && brandNameEn.includes(normalizedQuery)) || // 英語名がある場合のみ検索
        code.includes(normalizedQuery)
      );
    });

    console.log('Search results:', {
      query: normalizedQuery,
      found: results.length,
      samples: results.slice(0, 3)
    });

    monitor.end();
    return results;
  } catch (error) {
    console.error('Search Error:', error);
    monitor.end();
    return [];
  }
};

// キャッシュ操作用の補助関数
export const clearAnalyticsCache = (brandCode: string) => {
  localStorage.removeItem(CACHE_KEYS.BRAND_ANALYTICS + brandCode);
  localStorage.removeItem(CACHE_KEYS.EXPIRY.ANALYTICS + brandCode);
  console.log('Cleared cache for:', brandCode);
};