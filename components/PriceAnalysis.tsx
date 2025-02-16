'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { analyzeOutliersAndDistribution, groupSimilarProducts } from '../utils/priceAnalysis';
import { CategoryData } from '../types';  // 共通の型定義からインポート

// PriceQuartilesはCategoryDataの一部なので削除可能

interface PriceAnalysisProps {
  categoryData: CategoryData;
  brandNote: string;
}

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

  // 価格分析を実行
  const priceAnalysis = useMemo(() => {
    const prices = speedPriceData.map(item => item.price);
    return analyzeOutliersAndDistribution(prices);
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
      {/* ヘッダーセクション - 変更なし */}
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
      
      {/* 価格概要セクション - 変更なし */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg w-full">
          <h5 className="text-gray-300 mb-3">価格帯概要</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">最安値</span>
              <span className="text-lg text-white">¥{minPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">平均価格</span>
              <span className="text-lg text-green-400">¥{avgPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">最高値</span>
              <span className="text-lg text-white">¥{maxPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg w-full">
          <h5 className="text-gray-300 mb-3">推奨価格帯</h5>
          <div className="text-center">
            <div className="text-2xl text-blue-400">
              ¥{q1.toLocaleString()} ～ ¥{q3.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              売れ筋価格帯（全取引の50%がこの範囲）
            </div>
          </div>
        </div>
      </div>

      {/* グラフセクション - 変更なし */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="range" stroke="#9CA3AF" />
            <YAxis 
              stroke="#9CA3AF"
              tickFormatter={(value) => `${value/1000}k`}
              width={35}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              formatter={(value) => `¥${value.toLocaleString()}`}
            />
            <Bar dataKey="価格" fill="#60A5FA" />
            <ReferenceLine
              y={avgPrice}
              stroke="#10B981"
              strokeDasharray="3 3"
              label={{ 
                fill: '#10B981', 
                position: 'right' 
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 価格分布の分析セクション - 新規追加 */}
      {speedPriceData.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <h5 className="text-gray-300 mb-3">価格帯の分布</h5>
          {priceAnalysis.priceRanges.map((range, index) => {
            const count = speedPriceData.filter(
              item => item.price >= range.range[0] && item.price < range.range[1]
            ).length;
            const percentage = (count / speedPriceData.length) * 100;
            return (
              <div key={index} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {range.label}（¥{Math.round(range.range[0]).toLocaleString()}～）
                  </span>
                  <span className="text-gray-400">{count}件 ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full mt-1">
                  <div 
                    className="bg-blue-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {similarGroups.length > 0 && (
        <div className="bg-blue-900/30 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-400">📊</span>
            <h5 className="text-blue-400">類似商品グループ</h5>
          </div>
          <div className="space-y-3">
            {similarGroups.map((group, index) => (
              <div key={index} className="border-b border-gray-700 pb-2 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{group.baseName}</span>
                  <span className="text-sm text-blue-400">{group.totalCount}件</span>
                </div>
                <div className="text-xs text-gray-400">
                  平均価格: ¥{Math.round(group.avgPrice).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ※類似した名前の商品をグループ化しています
          </p>
        </div>
      )}

      {/* 外れ値の分析セクション - 新規追加 */}
      {priceAnalysis.outliers.length > 0 && (
        <div className="bg-yellow-900/30 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-400">⚠️</span>
            <h5 className="text-yellow-400">特別価格帯の商品</h5>
          </div>
          <div className="space-y-2">
            {priceAnalysis.outliers.map((price, index) => {
              const product = speedPriceData.find(item => item.price === price);
              return (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{product?.productName || '不明な商品'}</span>
                  <span className="text-sm text-yellow-400">¥{price.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ※通常の価格帯から大きく外れた商品です（平均から2標準偏差以上）
          </p>
        </div>
      )}

      {/* 商品情報セクション */}
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

      <div className="text-xs text-gray-400 text-right">
        総データ数: {totalItems}件
      </div>
    </div>
  );
};

interface ReliabilityMessage {
  message: string;
  bgColor: string;
  textColor: string;
}

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

export default PriceAnalysis;