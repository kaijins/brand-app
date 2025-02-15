'use client';

import React, { useMemo, useState } from 'react';
import {
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { Filter, CalendarRange } from 'lucide-react';
import { Payload } from 'recharts/types/component/DefaultTooltipContent';

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

interface SeasonalResult {
  filteredData: SpeedPriceData[];
  seasonRange: string;
  excludedCount: number;
}

interface CategoryData {
  speedPriceData: SpeedPriceData[];
  avgPrice: number;
}

const PriceSpeedChart: React.FC<{ categoryData: CategoryData }> = ({ 
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
      // 日付が存在しない場合はフィルタから除外
      const date = item.soldDate || item.listedDate;
      if (!date) return false;
      
      const itemDate = new Date(date);
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

    // 季節性フィルタの適用
    const seasonalResult = showSeasonal ? filterSeasonalData(validData) : { 
      filteredData: validData, 
      seasonRange: null, 
      excludedCount: 0 
    };

    // 外れ値の計算
    const dataToProcess = seasonalResult.filteredData;
    if (!dataToProcess.length) {
      return {
        processedData: [],
        normalData: [],
        outlierData: [],
        outlierCount: 0,
        seasonRange: seasonalResult.seasonRange,
        excludedSeasonalCount: seasonalResult.excludedCount,
        yAxisDomain: [0, 100],
        effectiveAvgPrice: avgPrice
      };
    }

    const prices = dataToProcess.map(item => item.originalPrice ?? 0);
    const sorted = [...prices].sort((a: number, b: number) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
    const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
    const iqr = q3 - q1;
    const upperBound = q3 + (1.5 * iqr);
    const lowerBound = q1 - (1.5 * iqr);

    // データの分類
    const normalData = dataToProcess.filter(
      item => (item.originalPrice ?? 0) >= lowerBound && (item.originalPrice ?? 0) <= upperBound
    );
    const outlierData = dataToProcess.filter(
      item => (item.originalPrice ?? 0) < lowerBound || (item.originalPrice ?? 0) > upperBound
    );

    const finalData = excludeOutliers ? normalData : dataToProcess;

    // Y軸の範囲を計算
    const displayPrices = finalData.map(item => item.displayPrice ?? 0);
    const yMin = displayPrices.length 
      ? Math.floor(Math.min(...displayPrices) * 0.9)
      : 0;
    const yMax = displayPrices.length 
      ? Math.ceil(Math.max(...displayPrices) * 1.1)
      : 100;

    // 平均価格を計算
    const effectiveAvg = finalData.length > 0
      ? finalData.reduce((sum, item) => sum + (item.originalPrice ?? 0), 0) / finalData.length
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
}, [speedPriceData, excludeOutliers, avgPrice, showSeasonal]);

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
                formatter={(value: number, name: string, props: Payload<number, string>) => {
                    if (!props.payload) return ['', ''];
                    if (name === "displayPrice") {
                      return [`¥${props.payload.originalPrice.toLocaleString()}`, '価格'];
                    }
                    return [
                      props.payload.originalDays > 60 ? '60日以上' : `${props.payload.originalDays}日`,
                      '販売日数'
                    ];
                  }}
                labelFormatter={(label: string) => label || '商品名なし'}
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