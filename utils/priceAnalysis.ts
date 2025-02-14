'use client';

export const analyzeOutliersAndDistribution = (prices: number[]) => {
    // 平均と標準偏差を計算
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    );
  
    // 外れ値の判定（平均から2標準偏差以上離れているものを外れ値とする）
    const outliers = prices.filter(price => 
      Math.abs(price - mean) > 2 * stdDev
    );
  
    // 価格帯の分布（標準偏差を使用）
    const priceRanges = [
      { label: '非常に安価', range: [0, mean - stdDev] },
      { label: '標準的な価格帯', range: [mean - stdDev, mean + stdDev] },
      { label: '高価格帯', range: [mean + stdDev, mean + 2 * stdDev] },
      { label: '特別価格帯', range: [mean + 2 * stdDev, Infinity] }
    ];
  
    return {
      outliers,
      priceRanges,
      mean,
      stdDev
    };
  };

// 商品名の類似性を判定する関数
export const groupSimilarProducts = (products) => {
    const groups = [];
    const processedIndices = new Set();
  
    products.forEach((product, i) => {
      if (processedIndices.has(i)) return;
  
      const similarGroup = {
        baseName: product.productName,
        products: [product],
        totalCount: 1,
        avgPrice: product.price
      };
  
      // 他の商品との類似性をチェック
      products.forEach((otherProduct, j) => {
        if (i === j || processedIndices.has(j)) return;
  
        // 商品名の類似性をチェック
        if (areSimilarNames(product.productName, otherProduct.productName)) {
          similarGroup.products.push(otherProduct);
          similarGroup.totalCount++;
          similarGroup.avgPrice = 
            similarGroup.products.reduce((sum, p) => sum + p.price, 0) / 
            similarGroup.products.length;
          processedIndices.add(j);
        }
      });
  
      if (similarGroup.totalCount > 1) {
        groups.push(similarGroup);
      }
      processedIndices.add(i);
    });
  
    return groups;
  };
  
  // 商品名の類似性を判定するヘルパー関数
  const areSimilarNames = (name1, name2) => {
    // 空白、記号を除去して小文字に変換
    const normalize = (str) => 
      str.toLowerCase().replace(/[\s　\-・]/g, '');
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // 完全一致の場合
    if (n1 === n2) return true;
    
    // 一方がもう一方を含む場合
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // 文字の一致率が80%以上の場合
    const maxLength = Math.max(n1.length, n2.length);
    let matchCount = 0;
    for (let i = 0; i < maxLength; i++) {
      if (n1[i] === n2[i]) matchCount++;
    }
    return (matchCount / maxLength) >= 0.8;
  };