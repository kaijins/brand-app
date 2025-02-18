'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, ImagePlus, BarChart2 } from 'lucide-react';
import SearchResults from './SearchResults';
import LogoUploader from './LogoUploader';
import LogoSearch from './LogoSearch';
import { searchBrandsBasic, getBrandAnalytics, getAllBrands } from '../utils/api';
import { AnalyticsData, Brand } from '../types';
import MonthlyAnalysis from './MonthlyAnalysis';

const BrandSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnalyticsData[] | null>(null);
  const [suggestions, setSuggestions] = useState<Brand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showLogoSearch, setShowLogoSearch] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMonthlyAnalysis, setShowMonthlyAnalysis] = useState(false);

  useEffect(() => {
    const initializeBrands = async () => {
      const result = await getAllBrands();
      console.log('Initial brands loaded:', result);
    };
    initializeBrands();
  }, []);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    
    if (!value.trim() || isLoading || isSearching) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await searchBrandsBasic(value);
      console.log('Got results:', results);

      if (!isSearching) {
        const normalizedInput = value.toLowerCase().trim();
        
        const groupedResults = {
          exact: results.filter((brand: Brand) => 
            brand.brandName_ja.toLowerCase() === normalizedInput ||
            brand.brandName_en?.toLowerCase() === normalizedInput ||
            brand.code.toLowerCase() === normalizedInput ||
            brand.parent?.toLowerCase() === normalizedInput  // 親会社名での完全一致を追加
          ),
          partial: results.filter((brand: Brand) => {
            const isExact = brand.brandName_ja.toLowerCase() === normalizedInput ||
                           brand.brandName_en?.toLowerCase() === normalizedInput ||
                           brand.code.toLowerCase() === normalizedInput ||
                           brand.parent?.toLowerCase() === normalizedInput;  // 親会社名での完全一致を追加
            return !isExact && (
              brand.brandName_ja.toLowerCase().includes(normalizedInput) ||
              brand.brandName_en?.toLowerCase().includes(normalizedInput) ||
              brand.code.toLowerCase().includes(normalizedInput) ||
              brand.parent?.toLowerCase().includes(normalizedInput)
            );
          })
        };

        setSuggestions([...groupedResults.exact, ...groupedResults.partial]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isLoading, isSearching]);

  const handleBrandSelect = useCallback(async (brand: Brand) => {
    setIsLoading(true);
    setIsSearching(true);
    setSearchQuery(brand.brandName_ja);
    setShowSuggestions(false);
    setSuggestions([]);

    if (inputRef.current) {
      inputRef.current.blur();
    }

    try {
      console.log('Requesting analytics for brand:', brand.brandName_ja);
      const analyticsData = await getBrandAnalytics(brand.brandName_ja);
      
      setSearchResults([{
        ...brand,
        ...analyticsData
      }]);
    } catch (error) {
      console.error('検索エラー:', error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  const handleClickOutside = useCallback(() => {
    if (showSuggestions) {
      setShowSuggestions(false);
    }
  }, [showSuggestions]);

  const handleFocus = useCallback(() => {
    if (!isSearching && !isLoading && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions, isSearching, isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-2xl mx-auto pt-16 px-4 sm:px-6 lg:px-8">  {/* レスポンシブ対応を追加 */}
        <h1 className="text-2xl font-bold mb-8 text-center">メルカリ価格検索</h1>
        
        <div className="flex space-x-4 mb-6 justify-center items-center">
          <button
            onClick={() => setShowLogoSearch(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center h-10 w-10"
            title="ロゴで検索"
          >
            <Search size={20} className="text-gray-400 hover:text-gray-300" />
          </button>
          <button
            onClick={() => setShowUploader(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center h-10 w-10"
            title="ロゴ画像を追加"
          >
            <ImagePlus size={20} className="text-gray-400 hover:text-gray-300" />
          </button>
          <button
            onClick={() => setShowMonthlyAnalysis(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center h-10 w-10"
            title="月次分析"
          >
            <BarChart2 size={20} className="text-gray-400 hover:text-gray-300" />
          </button>
        </div>

        {showLogoSearch && (
          <div className="mb-6">
            <LogoSearch 
              onClose={() => setShowLogoSearch(false)} 
              onBrandFound={(brandData) => {
                setSearchResults([brandData]);
                setShowLogoSearch(false);
              }}
            />
          </div>
        )}
        
        {showUploader && <LogoUploader onClose={() => setShowUploader(false)} />}

        {/* MonthlyAnalysisの表示制御 */}
        {showMonthlyAnalysis && (
          <div className="mb-6">
            <MonthlyAnalysis />
            <button
              onClick={() => setShowMonthlyAnalysis(false)}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-gray-200 transition-colors"
            >
              分析を閉じる
            </button>
          </div>
        )}

        {/* 既存の検索UI */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="ブランド名で検索"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 
                      focus:outline-none focus:border-blue-500 text-gray-100"
            disabled={isLoading}
          />
          
          {showSuggestions && suggestions.length > 0 && !isSearching && (
            <div className="absolute w-full mt-1 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700">
              {suggestions.map((brand, index) => (
                <div
                key={index}
                className="p-2 hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => handleBrandSelect(brand)}
              >
                <div className="font-medium">{brand.brandName_ja}</div>
                <div className="text-sm text-gray-400">
                  {brand.brandName_en}
                  <span className="ml-2 text-xs">({brand.code})</span>
                  {brand.parent && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                      {brand.parent}
                    </span>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
  
        {isLoading ? (
          <div className="mt-4 text-center text-gray-400">読み込み中...</div>
        ) : (
          searchResults && searchResults.map((result, index) => (
            <SearchResults key={index} brandData={result} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrandSearch;