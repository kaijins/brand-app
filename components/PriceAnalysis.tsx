'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { analyzeOutliersAndDistribution, groupSimilarProducts } from '../utils/priceAnalysis';
import { CategoryData } from '../types';
import { calculateReliabilityScore } from '../utils/reliabilityAnalysis';

interface PriceAnalysisProps {
  categoryData: CategoryData;
  brandNote: string;
}

interface ReliabilityBadgeProps {
  score: number;
  level: string;
  warnings: string[];
}

interface PriceSpeedCorrelation {
  range: string;
  avgDays: number;
  itemCount: number;
  avgPrice: number;
}

interface ReliabilityMessage {
  message: string;
  bgColor: string;
  textColor: string;
}

interface SpeedPriceData {
  productName: string;
  price: number;
  soldDays: number;
  image: string;
  soldDate: string;
}

const analyzePriceSpeedCorrelation = (speedPriceData: any[]): PriceSpeedCorrelation[] => {
  if (!speedPriceData.length) return [];

  const prices = speedPriceData.map(d => d.price);
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];

  const priceRanges = {
    low: {
      items: speedPriceData.filter(d => d.price < q1),
      label: '低価格帯'
    },
    middle: {
      items: speedPriceData.filter(d => d.price >= q1 && d.price <= q3),
      label: '中価格帯'
    },
    high: {
      items: speedPriceData.filter(d => d.price > q3),
      label: '高価格帯'
    }
  };

  return Object.entries(priceRanges).map(([key, range]) => ({
    range: range.label,
    avgDays: range.items.length ? 
      Math.round(range.items.reduce((sum, item) => sum + item.soldDays, 0) / range.items.length) : 0,
    itemCount: range.items.length,
    avgPrice: range.items.length ?
      Math.round(range.items.reduce((sum, item) => sum + item.price, 0) / range.items.length) : 0
  }));
};

const getReliabilityMessage = (totalItems: number): ReliabilityMessage | null => {
  if (totalItems < 10) {
    return {
      message: 'データ数が少ないため参考値',
      bgColor: 'bg-yellow-900/50',
      textColor: 'text-yellow-500'
    };
  } else if (totalItems < 30) {
    return {
      message: '参考程度の情報',
      bgColor: 'bg-blue-900/50',
      textColor: 'text-blue-400'
    };
  } else if (totalItems < 50) {
    return {
      message: '信頼性のある分析',
      bgColor: 'bg-green-900/50',
      textColor: 'text-green-400'
    };
  }
  return null;
};

const ReliabilityBadge: React.FC<ReliabilityBadgeProps> = ({ score, level, warnings }) => {
  const bgColor = level === 'high' ? 'bg-green-500/20' 
    : level === 'medium' ? 'bg-yellow-500/20' 
    : 'bg-red-500/20';

  return (
    <div className={`rounded-lg p-2 ${bgColor}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">信頼度スコア: {score}</span>
        {warnings.length > 0 && (
          <span className="text-xs text-gray-400">
            {warnings[0]}
          </span>
        )}
      </div>
    </div>
  );
};

const PriceAnalysis: React.FC<PriceAnalysisProps> = ({ 
  categoryData = {
    priceQuartiles: { q1: 0, median: 0, q3: 0 },
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    soldCount: 0,
    listingCount: 0,
    speedPriceData: []
  }, 
  brandNote = '' 
}) => {
  const {
    minPrice = 0,
    maxPrice = 0,
    avgPrice = 0,
    soldCount = 0,
    listingCount = 0,
    speedPriceData = []
  } = categoryData;

  const q1 = categoryData.priceQuartiles?.q1 ?? 0;
  const median = categoryData.priceQuartiles?.median ?? 0;
  const q3 = categoryData.priceQuartiles?.q3 ?? 0;

  // 信頼度スコアの計算
  const reliabilityData = useMemo(() => {
    if (!speedPriceData.length) return null;

    return calculateReliabilityScore(
      speedPriceData
        .filter(data => data.soldDate)
        .map(data => ({
          price: data.price,
          soldDate: data.soldDate ? new Date(data.soldDate) : new Date()
        }))
    );
  }, [speedPriceData]);

  // 価格分析を実行
  const priceAnalysis = useMemo(() => {
    const prices = speedPriceData.map(item => item.price);
    return analyzeOutliersAndDistribution(prices);
  }, [speedPriceData]);

  // 価格帯と販売速度の相関
  const priceSpeedCorrelation = useMemo(() => {
    return analyzePriceSpeedCorrelation(speedPriceData);
  }, [speedPriceData]);

   // ソート済み商品データ（新規追加）
   const sortedProducts = useMemo(() => {
    return [...speedPriceData]
  .sort((a, b) => {
    const dateA = a.soldDate ? new Date(a.soldDate) : new Date(0);
    const dateB = b.soldDate ? new Date(b.soldDate) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  }, [speedPriceData]);

  // 類似商品のグループを取得
  const similarGroups = useMemo(() => {
    return groupSimilarProducts(speedPriceData);
  }, [speedPriceData]);

  // Top3高額商品の取得
  const topProducts = [...speedPriceData]
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 3)
    .map(product => ({
      ...product,
      price: product.price || 0,
      name: product.productName || '商品名なし'
    }));

  const chartData = [
    {
      range: '最安値～25%',
      価格: minPrice,
      end: q1
    },
    {
      range: '25%～50%',
      価格: q1,
      end: median
    },
    {
      range: '50%～75%',
      価格: median,
      end: q3
    },
    {
      range: '75%～最高値',
      価格: q3,
      end: maxPrice
    }
  ];

  const totalItems = soldCount + listingCount;
  const reliabilityInfo = getReliabilityMessage(totalItems);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      {/* 信頼度スコア */}
      {reliabilityData && (
        <div className="mb-4">
          <ReliabilityBadge 
            score={reliabilityData.score}
            level={reliabilityData.confidenceLevel}
            warnings={reliabilityData.warnings}
          />
        </div>
      )}
  
      {/* ヘッダー */}
      <div className="border-b border-gray-700 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl text-gray-100">価格分析</h2>
          {reliabilityInfo && (
            <div className={`px-3 py-1 rounded-full text-sm ${reliabilityInfo.bgColor} ${reliabilityInfo.textColor} flex items-center gap-1`}>
              <span className="w-4 h-4">ℹ️</span>
              {reliabilityInfo.message}
            </div>
          )}
        </div>
        {brandNote && (
          <div className="text-sm text-gray-400 mt-2 flex items-start gap-2">
            <span className="w-4 h-4">ℹ️</span>
            <span>{brandNote}</span>
          </div>
        )}
      </div>
  
      {/* 価格分布グラフ */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="range" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${value/1000}k`} width={35} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
            <Bar dataKey="価格" fill="#60A5FA" />
            <ReferenceLine y={avgPrice} stroke="#10B981" strokeDasharray="3 3" 
              label={{ fill: '#10B981', position: 'right' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
  
      {/* 価格帯と販売速度の相関 */}
      {priceSpeedCorrelation.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <h5 className="text-gray-300 mb-4">価格帯別の販売速度</h5>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceSpeedCorrelation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#D1D5DB' }} />
                <Bar yAxisId="left" dataKey="avgDays" fill="#8B5CF6" name="平均販売日数" />
                <Bar yAxisId="right" dataKey="itemCount" fill="#10B981" name="データ数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {priceSpeedCorrelation.map((data, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded">
                <div className="text-sm text-gray-400">{data.range}</div>
                <div className="text-lg text-white">{data.avgDays}日</div>
                <div className="text-xs text-gray-500">
                  平均¥{data.avgPrice.toLocaleString()} ({data.itemCount}件)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  
      {/* Top3高額商品 */}
      {speedPriceData.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <h5 className="text-gray-300 mb-3">高額取引 Top3</h5>
          <div className="space-y-2">
            {topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{product.name}</span>
                <span className="text-sm text-white">¥{product.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 取扱商品履歴（新規追加） */}
      {speedPriceData.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <h5 className="text-gray-300 mb-3">取扱商品履歴</h5>
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="text-sm text-gray-400">
                <tr className="border-b border-gray-600">
                  <th className="pb-2 text-left">商品名</th>
                  <th className="pb-2 text-right">価格</th>
                  <th className="pb-2 text-cleft whitespace-nowrap">日数</th>
                  <th className="pb-2 text-center">着画</th>
                  <th className="pb-2 text-right">売却日</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-600 last:border-0">
                    <td className="py-2 text-gray-300">{product.productName}</td>
                    <td className="py-2 text-right text-white">
                      ¥{product.price.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-gray-300">
                      {product.soldDays}日
                    </td>
                    <td className="py-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.image && product.image !== '着画なし' 
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {product.image && product.image !== '着画なし' ? '有' : '無'}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-400">
                    {product.soldDate 
                      ? new Date(product.soldDate).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                      : '-'
                    }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-right">
        総データ数: {totalItems}件
      </div>
    </div>
  );
};

export default PriceAnalysis;