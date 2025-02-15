'use client';

import React from 'react';
import { TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import _ from 'lodash';

// 基本的なデータ型の定義
interface SpeedPriceData {
  price: number;
  productName: string;
  soldDays?: number;
  condition?: string;
  image?: string;
}

interface CategoryData {
  category: string;
  soldCount: number;
  listingCount: number;
  speedPriceData?: SpeedPriceData[];
  prices?: number[];
}

// 価値評価の戻り値の型定義
interface ValueAssessmentResult {
  title: string;
  containerClass: string;
  icon: JSX.Element;
  messageClass: string;
  bgClass: string;
}

interface ValueAssessmentProps {
  categoryData: CategoryData;
  allCategories: CategoryData[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const ValueAssessment: React.FC<ValueAssessmentProps> = ({ 
  categoryData, 
  allCategories = [], 
  selectedCategory,
  onCategorySelect 
}) => {
  // 価値評価の判定
  const getValueAssessment = (price: number): ValueAssessmentResult => {
    if (price >= 5000) {
      return {
        title: '高額が狙えるブランドです',
        containerClass: 'bg-purple-900/30 border-purple-800/50',
        icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
        messageClass: 'text-purple-300',
        bgClass: 'bg-purple-900/20'
      };
    } else if (price >= 3000) {
      return {
        title: '高価になる可能性があります',
        containerClass: 'bg-blue-900/30 border-blue-800/50',
        icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
        messageClass: 'text-blue-300',
        bgClass: 'bg-blue-900/20'
      };
    } else if (price >= 1800) {
      return {
        title: '価値があるブランドです',
        containerClass: 'bg-green-900/30 border-green-800/50',
        icon: <TrendingUp className="w-5 h-5 text-green-400" />,
        messageClass: 'text-green-300',
        bgClass: 'bg-green-900/20'
      };
    } else {
      return {
        title: '価値が低いブランドです',
        containerClass: 'bg-gray-800 border-gray-700',
        icon: <AlertCircle className="w-5 h-5 text-gray-400" />,
        messageClass: 'text-gray-400',
        bgClass: 'bg-gray-800/20'
      };
    }
  };

  // 外れ値を除外した平均価格を計算
  const calculateAdjustedAverage = (prices: number[]): number => {
    if (!prices.length) return 0;
    
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const upperBound = q3 + (iqr * 1.5);
    const lowerBound = q1 - (iqr * 1.5);
    
    const filteredPrices = prices.filter(
      price => price >= lowerBound && price <= upperBound
    );
    
    return filteredPrices.length > 0 
      ? _.mean(filteredPrices)
      : _.mean(prices);
  };

  const renderMainAssessment = (data: CategoryData) => {
    const prices = data.speedPriceData?.map(item => item.price) || [];
    const adjustedAvgPrice = calculateAdjustedAverage(prices);
    const assessment = getValueAssessment(adjustedAvgPrice);
    const maxPriceItem = _.maxBy(data.speedPriceData || [], 'price');
    const hasHighValueItem = maxPriceItem && maxPriceItem.price >= adjustedAvgPrice * 1.5;

    return (
      <div className={`rounded-lg border p-4 ${assessment.containerClass} transition-all hover:shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {assessment.icon}
            <h3 className="font-medium text-white">{data.category}</h3>
          </div>
          <span className="text-sm text-gray-400">
            {data.soldCount}件の取引実績
          </span>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
          <h4 className={`flex items-center gap-2 text-lg mb-2 ${assessment.messageClass}`}>
            {assessment.title}
          </h4>
          <div className="text-white">
            想定価格: ¥{Math.round(adjustedAvgPrice).toLocaleString()}
          </div>
        </div>

        {hasHighValueItem && (
          <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg p-4">
            <h4 className="text-yellow-400 mb-1">高額商品の取り扱い実績あり</h4>
            <div className="text-yellow-300">
              {maxPriceItem.productName}: ¥{maxPriceItem.price.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategoryCard = (catData: CategoryData) => {
    const prices = catData.speedPriceData?.map(item => item.price) || [];
    if (prices.length === 0) return null;

    const adjustedAvgPrice = calculateAdjustedAverage(prices);
    const assessment = getValueAssessment(adjustedAvgPrice);
  
    return (
      <div
        key={catData.category}
        onClick={() => onCategorySelect(catData.category)}
        className={`${assessment.bgClass} border border-gray-700 rounded-lg cursor-pointer 
          transition-all hover:shadow-lg hover:scale-105`}
      >
        {/* モバイル用レイアウト（1列時） */}
        <div className="md:hidden p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 flex-shrink-0">
                {assessment.icon}
                <span className="text-white text-sm font-medium">{catData.category}</span>
              </div>
              <div className={`${assessment.messageClass} text-xs truncate ml-1`}>
                ¥{Math.round(adjustedAvgPrice).toLocaleString()} 
                <span className="text-gray-400">（{catData.soldCount}件）</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          </div>
          <div className={`${assessment.messageClass} text-xs mt-1 truncate`}>
            {assessment.title}
          </div>
        </div>
  
        {/* PC用レイアウト（2列時） */}
        <div className="hidden md:block p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {assessment.icon}
              <span className="text-white font-medium">{catData.category}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`${assessment.messageClass} text-sm mb-1`}>
            {assessment.title}
          </div>
          <div className="text-gray-400 text-sm">
            ¥{Math.round(adjustedAvgPrice).toLocaleString()}
            <span className="ml-1">（{catData.soldCount}件）</span>
          </div>
        </div>
      </div>
    );
  };  

  if (selectedCategory !== '全カテゴリー') {
    return renderMainAssessment(categoryData);
  }

  const validCategories = allCategories.filter(cat => 
    cat.category !== '全カテゴリー' && 
    cat.speedPriceData?.length > 0
  );

  return (
    <div className="space-y-6">
      {/* メインの価値評価 */}
      {renderMainAssessment(categoryData)}

      {/* カテゴリー別の評価一覧 */}
      {validCategories.length > 0 && (
        <div>
          <h4 className="text-gray-400 text-sm mb-3">カテゴリー別の評価</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {validCategories.map(renderCategoryCard)}
            </div>
        </div>
      )}
    </div>
  );
};

export default ValueAssessment;