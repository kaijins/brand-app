'use client';

import React, { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Filter, CalendarRange } from 'lucide-react';

// 型定義を追加
interface SpeedPriceData {
  price: number;
  soldDays: number;
  productName: string;
  displayDays?: number;
  displayPrice?: number;
  originalPrice?: number;
  originalDays?: number;
  listedDate?: string;
  soldDate?: string;
  condition?: string;
  image?: string;
}

interface CategoryData {
  speedPriceData: SpeedPriceData[];
  avgPrice: number;
}

interface PriceSpeedChartProps {
  categoryData: CategoryData;
}

// コンポーネントの定義を修正
const PriceSpeedChart: React.FC<PriceSpeedChartProps> = ({ 
  categoryData = {
    speedPriceData: [],
    avgPrice: 0
  }
}) => {
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);

  const {
    speedPriceData = [],
    avgPrice = 0
  } = categoryData;

   // 季節性フィルタの適用
   interface SeasonalResult {
    filteredData: SpeedPriceData[];
    seasonRange: string;
    excludedCount: number;
  }

// TODO: 今後の開発で使う予定（例: フィルタ機能追加時）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterSeasonalData = (data: SpeedPriceData[]): SeasonalResult => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const prevMonth = (currentMonth - 1 + 12) % 12;
    const nextMonth = (currentMonth + 1) % 12;

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    const seasonRange = [prevMonth, currentMonth, nextMonth]
      .map(m => monthNames[m])
      .join('・');

    const seasonalData = data.filter(item => {
      if (!item.soldDate && !item.listedDate) return false;
      const rawDate = item.soldDate ?? item.listedDate ?? null;
      if (!rawDate) return false; // `null` の場合はフィルターで弾く
      const itemDate = new Date(rawDate);
      //const itemDate = new Date(item.soldDate || item.listedDate);
      const itemMonth = itemDate.getMonth();
      return [prevMonth, currentMonth, nextMonth].includes(itemMonth);
    });

    return {
      filteredData: seasonalData,
      seasonRange,
      excludedCount: data.length - seasonalData.length
    };
  };

  const analyzed = useMemo(() => {
    const MAX_DAYS_DISPLAY = 60;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validData = speedPriceData.filter(item => 
      item && 
      typeof item.price === 'number' && 
      typeof item.soldDays === 'number' && 
      !isNaN(item.price) && 
      !isNaN(item.soldDays)
    ).map(item => ({
      ...item,
      displayDays: Math.min(item.soldDays, MAX_DAYS_DISPLAY),
      displayPrice: Math.round(item.price / 1000),
      originalPrice: item.price,
      originalDays: item.soldDays
    }));

    const seasonalResult = filterSeasonalData(speedPriceData); // ⬅ ここを追加

    // 外れ値の計算
    const dataToProcess = seasonalResult.filteredData;
    const prices = dataToProcess.map(item => item.originalPrice);
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const upperBound = q3 + (1.5 * iqr);
    const lowerBound = q1 - (1.5 * iqr);

    // データの分類
    const normalData = dataToProcess.filter(
      item => item.originalPrice >= lowerBound && item.originalPrice <= upperBound
    );
    const outlierData = dataToProcess.filter(
      item => item.originalPrice < lowerBound || item.originalPrice > upperBound
    );

    const finalData = excludeOutliers ? normalData : dataToProcess;

    // Y軸の範囲を計算
    const displayPrices = finalData.map(item => item.displayPrice);
    const yMin = Math.floor(Math.min(...displayPrices) * 0.9);
    const yMax = Math.ceil(Math.max(...displayPrices) * 1.1);

    // 平均価格を計算
    const effectiveAvg = finalData.length > 0
      ? finalData.reduce((sum, item) => sum + item.originalPrice, 0) / finalData.length
      : avgPrice;

    return {
      processedData: finalData,
      normalData,
      outlierData,
      outlierCount: outlierData.length,
      seasonRange: seasonalResult.seasonRange,
      excludedSeasonalCount: seasonalResult.excludedCount,
      yAxisDomain: [yMin, yMax],
      effectiveAvgPrice: effectiveAvg
    };
  }, [speedPriceData, excludeOutliers, avgPrice]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-700 pb-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl text-gray-100">価格と販売期間の関係</h2>
          <div className="text-sm text-gray-400">
            {analyzed.processedData.length}件
            {excludeOutliers && analyzed.outlierCount > 0 && (
              <span className="text-blue-400 ml-1">
                （{analyzed.outlierCount}件の外れ値を除外）
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setExcludeOutliers(!excludeOutliers)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              ${excludeOutliers 
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'}`}
          >
            <Filter size={16} />
            外れ値を除外
          </button>

          <button
            onClick={() => setShowSeasonal(!showSeasonal)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              ${showSeasonal 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'}`}
          >
            <CalendarRange size={16} />
            季節性分析
          </button>

          {showSeasonal && analyzed.seasonRange && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-900/20 text-green-300">
              <span>{analyzed.seasonRange}</span>
              {analyzed.excludedSeasonalCount > 0 && (
                <span className="text-gray-400">
                  ({analyzed.excludedSeasonalCount}件の期間外データを除外)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              type="number" 
              dataKey="displayDays" 
              domain={[0, 60]}
              tickFormatter={(value) => value === 60 ? '60+' : value}
              stroke="#9CA3AF"
            />
            <YAxis 
              type="number" 
              dataKey="displayPrice"
              domain={analyzed.yAxisDomain}
              tickFormatter={(value) => `${value}k`}
              width={35}
              stroke="#9CA3AF"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none',
                borderRadius: '4px',
                padding: '8px'
              }}
              formatter={(value, name, props) => {
                const item = props.payload;
                if (name === "displayPrice") {
                  return [`¥${item.originalPrice.toLocaleString()}`, '価格'];
                }
                return [
                  item.originalDays > 60 ? '60日以上' : `${item.originalDays}日`,
                  '販売日数'
                ];
              }}
              labelFormatter={(value, name, props) => props.payload.productName || '商品名なし'}
            />
            <Scatter 
              data={analyzed.processedData} 
              fill="#60A5FA"
              opacity={0.6}
            />
            <ReferenceLine 
              y={analyzed.effectiveAvgPrice/1000}
              stroke="#10B981" 
              strokeDasharray="3 3"
              label={{ 
                value: `平均¥${Math.round(analyzed.effectiveAvgPrice/1000)}k`, 
                fill: '#10B981', 
                position: 'right' 
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceSpeedChart;