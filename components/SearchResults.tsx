'use client';

import { useState, useMemo } from 'react';  // useMemoを追加
import { TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import PriceAnalysis from './PriceAnalysis';
import PriceSpeedChart from './PriceSpeedChart';
import ValueAssessment from './ValueAssessment';

// SearchResultsコンポーネント
const SearchResults = ({ brandData }) => {
  const [selectedCategory, setSelectedCategory] = useState(
    brandData.categories?.[0]?.category || ''
  );

  // まずデバッグ用のbrandDataのログ
  console.log('brandData:', brandData);
  console.log('brandData.note:', brandData?.note);

  const selectedCategoryData = useMemo(() => {
    const result = brandData.categories?.find(
      cat => cat.category === selectedCategory
    ) || brandData.categories?.[0] || {};
    return result;
  }, [brandData, selectedCategory]);

  // selectedCategoryData定義後にログ出力
  console.log('categoryData:', selectedCategoryData);
  console.log('speedPriceData:', selectedCategoryData?.speedPriceData);

// MercariSearchLinkコンポーネントを先に定義
const MercariSearchLink = ({ brandName }: { brandName: string }) => {
  const encodedName = encodeURIComponent(brandName);
  const searchUrl = `https://jp.mercari.com/search?keyword=${encodedName}`;

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2"
    >
      <Search className="w-4 h-4" />
      <span>メルカリで検索</span>
    </a>
  );
};

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4 shadow-lg">
      {/* ブランド基本情報 */}
<div className="mb-4">
  <h3 className="text-xl font-bold text-white">
    {brandData.brandName_ja}
    <span className="text-sm text-gray-400 ml-2">({brandData.code})</span>
  </h3>
  <p className="text-sm text-gray-400">{brandData.brandName_en}</p>
  <MercariSearchLink brandName={brandData.brandName_ja} />
  {brandData.note && brandData.note.length > 0 && (
    <div className="mt-3 p-3 bg-yellow-900/30 rounded-lg">
      <p className="text-sm text-yellow-400 flex items-start gap-2">
        <span className="mt-1">⚠️</span>
        <span>{brandData.note}</span>
      </p>
    </div>
  )}
</div>

      {/* カテゴリー選択 */}
      <div className="mb-4">
        <select 
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {brandData.categories?.map(cat => (
            <option key={cat.category} value={cat.category}>
              {cat.category} ({cat.soldCount + cat.listingCount}件)
            </option>
          ))}
        </select>
      </div>

      {/* 取引統計 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">売却済み</div>
          <div className="text-green-400 text-lg">{selectedCategoryData.soldCount}件</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm">出品中</div>
          <div className="text-blue-400 text-lg">{selectedCategoryData.listingCount}件</div>
        </div>
      </div>

      {/* 価格情報 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-white shrink-0" size={16} />
            <span className="text-gray-400 text-sm">価格帯</span>
          </div>
          <div className="text-white text-sm">
            ¥{selectedCategoryData.minPrice?.toLocaleString()} - 
            ¥{selectedCategoryData.maxPrice?.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="text-white shrink-0" size={16} />
            <span className="text-gray-400 text-sm">平均価格</span>
          </div>
          <div className="text-white text-sm">
            ¥{selectedCategoryData.avgPrice?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 販売日数 */}
      <div className="bg-gray-700 p-3 rounded mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="text-white shrink-0" size={16} />
          <span className="text-gray-400 text-sm">平均販売日数</span>
        </div>
        <div className="text-white text-sm">
          {selectedCategoryData.avgSoldDays}日
        </div>
      </div>

      {/* 販売価値 */}
      <div className="mb-6">
        <h4 className="text-gray-400 text-sm mb-4">価値評価</h4>
        <ValueAssessment 
          categoryData={selectedCategoryData}
          allCategories={brandData.categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </div>

      {/* 価格分析 */}
      <PriceAnalysis categoryData={selectedCategoryData} brandNote={brandData.note} />
      <PriceSpeedChart categoryData={selectedCategoryData} />

      {/* 商品一覧 */}
      {selectedCategoryData.productNames && (
        <div className="mt-4">
          <h4 className="text-gray-400 text-sm mb-2">取扱商品履歴</h4>
          <div className="bg-gray-700 p-3 rounded max-h-40 overflow-y-auto">
            {selectedCategoryData.productNames?.split(', ').map((name, index) => (
              <div key={index} className="text-white py-1">
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;