'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';  // これを追加
import { getAllLogos, LogoData } from '../utils/logoDatabase';
import { compareImages } from '../utils/imageComparison';
import { getBrandAnalytics } from '../utils/api';

interface LogoSearchProps {
    onClose: () => void;
    onBrandFound: (brandData: AnalyticsData) => void;  // 追加
  }
  
  const LogoSearch: React.FC<LogoSearchProps> = ({ onClose, onBrandFound }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{logo: LogoData, similarity: number}>>([]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSearching(true);
    try {
      // アップロードされた画像をBase64に変換
      const reader = new FileReader();
      reader.onloadend = async () => {
        const searchImage = reader.result as string;
        const storedLogos = await getAllLogos();
        
        // 全ロゴと比較
        const comparisons = await Promise.all(
          storedLogos.map(async (logo) => ({
            logo,
            similarity: await compareImages(searchImage, logo.imageData)
          }))
        );

        // 類似度でソート
        const sortedResults = comparisons
          .sort((a, b) => b.similarity - a.similarity)
          .filter(result => result.similarity > 60); // 60%以上の類似度のみ表示

        setResults(sortedResults);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Search error:', error);
      alert('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-300">ロゴで検索</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-400 hover:text-gray-300" />
        </button>
      </div>
  
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isSearching}
        className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:disabled:opacity-50 file:disabled:cursor-not-allowed"
      />
  
      {isSearching && (
        <div className="mt-4 text-center text-gray-400">検索中...</div>
      )}
  
      {results.length > 0 && (
        <div className="mt-4 space-y-4">
          {results.map(({logo, similarity}, index) => (
            <div 
              key={index} 
              className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={async () => {
                try {
                  // brandName_jaで検索
                  const brandData = await getBrandAnalytics(logo.brandName);
                  if (brandData) {
                    onBrandFound({
                      brandName_ja: logo.brandName,
                      ...brandData
                    });
                    onClose();
                  }
                } catch (error) {
                  console.error('Error fetching brand data:', error);
                }
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-medium">{logo.brandName}</span>
                <span className="text-gray-400">類似度: {similarity.toFixed(1)}%</span>
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-800 p-2">
                <img 
                  src={logo.imageData} 
                  alt={logo.brandName}
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
              <div className="mt-2 text-sm text-gray-400 text-center">
                クリックしてブランド情報を表示
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogoSearch;