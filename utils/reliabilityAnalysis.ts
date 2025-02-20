// utils/reliabilityAnalysis.ts
interface ReliabilityScore {
    score: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    warnings: string[];
  }
  
  interface PriceData {
    price: number;
    soldDate: Date;
  }
  
  export function calculateReliabilityScore(data: PriceData[]): ReliabilityScore {
    const prices = data.map(d => d.price);
    const minSamples = 5;
    const optimalSamples = 30;
  
    // サンプル数による基礎スコア（0-50点）
    const sampleScore = Math.min(50, (prices.length / optimalSamples) * 50);
  
    // データのばらつきによるスコア（0-50点）
    let variabilityScore = 0;
    if (prices.length >= minSamples) {
      // 四分位数を計算
      const sorted = [...prices].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const median = sorted[Math.floor(sorted.length * 0.5)];
  
      // 中心的な価格帯（IQR内）に含まれる商品の割合を計算
      const centralPrices = prices.filter(p => p >= q1 && p <= q3);
      const centralRatio = centralPrices.length / prices.length;
  
      // 中心価格帯のばらつきを評価
      const centralMean = centralPrices.reduce((a, b) => a + b) / centralPrices.length;
      const centralStdDev = Math.sqrt(
        centralPrices.map(p => (p - centralMean) ** 2)
          .reduce((a, b) => a + b) / centralPrices.length
      );
      const centralCV = centralStdDev / centralMean;
  
      // スコアの計算
      // 1. 中心価格帯の比率による点数（30点満点）
      const centralScore = 30 * Math.min(1, centralRatio / 0.5);  // 50%以上を期待
      
      // 2. 中心価格帯のばらつきによる点数（20点満点）
      const acceptableCV = 0.3;  // 中心価格帯では小さいばらつきを期待
      const variabilityPoints = 20 * (1 - Math.min(1, centralCV / acceptableCV));
  
      variabilityScore = centralScore + variabilityPoints;
    }
  
    const totalScore = Math.round(sampleScore + variabilityScore);
  
    // 以下は同じ...
  
    // 信頼度レベルの判定（基準も調整）
    const confidenceLevel = totalScore >= 70 ? 'high' 
      : totalScore >= 30 ? 'medium' 
      : 'low';
  
    // 警告メッセージの生成
    const warnings = [];
    if (prices.length < minSamples) {
      warnings.push('データ数が少ないため参考値です');
    } else if (prices.length < optimalSamples) {
      warnings.push('より多くのデータで精度が向上します');
    }
  
    return {
      score: Math.max(0, Math.min(100, totalScore)),
      confidenceLevel,
      warnings
    };
  }