'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import SearchResults from './SearchResults';
import { searchBrandsBasic, getBrandAnalytics, getAllBrands } from '../utils/api';

const BrandSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const initializeBrands = async () => {
      const result = await getAllBrands();  // testGetAllBrands の代わりに直接 getAllBrands を使用
      console.log('Initial brands loaded:', result);
    };
    initializeBrands();
  }, []);

  const handleSearch = useCallback(async (value) => {
    if (!value || isSearching) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  
    try {
      const results = await searchBrandsBasic(value);
      // 検索中でなければ結果を表示
      if (!isSearching) {
        const groupedResults = results.reduce((groups, brand) => {
          const exactMatch = brand.brandName_ja.toLowerCase() === value.toLowerCase() || 
                           brand.brandName_en.toLowerCase() === value.toLowerCase();
          const partialMatch = brand.brandName_ja.toLowerCase().includes(value.toLowerCase()) ||
                             brand.brandName_en.toLowerCase().includes(value.toLowerCase());
          
          if (exactMatch) {
            groups.exact.push(brand);
          } else if (partialMatch) {
            groups.partial.push(brand);
          }
          return groups;
        }, { exact: [], partial: [] });
  
        setSuggestions([...groupedResults.exact, ...groupedResults.partial]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setSuggestions([]);
    }
  }, [isSearching]);

// サジェスト検索時は基本情報のみ取得
const handleInputChange = useCallback(async (e) => {
  const value = e.target.value;
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
      
      // シンプルなグループ化ロジック
      const groupedResults = {
        exact: results.filter(brand => 
          brand.brandName_ja.toLowerCase() === normalizedInput ||
          brand.brandName_en.toLowerCase() === normalizedInput ||
          brand.code.toLowerCase() === normalizedInput
        ),
        partial: results.filter(brand => {
          const isExact = brand.brandName_ja.toLowerCase() === normalizedInput ||
                         brand.brandName_en.toLowerCase() === normalizedInput ||
                         brand.code.toLowerCase() === normalizedInput;
          return !isExact && (
            brand.brandName_ja.toLowerCase().includes(normalizedInput) ||
            brand.brandName_en.toLowerCase().includes(normalizedInput) ||
            brand.code.toLowerCase().includes(normalizedInput)
          );
        })
      };

      setSuggestions([...groupedResults.exact, ...groupedResults.partial]);
      setShowSuggestions(true);
      console.log('Set grouped suggestions:', {
        exact: groupedResults.exact.length,
        partial: groupedResults.partial.length
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    setSuggestions([]);
    setShowSuggestions(false);
  }
}, [isLoading, isSearching]);

// handleBrandSelect も修正
const handleBrandSelect = useCallback(async (brand) => {
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
    const analyticsData = await getBrandAnalytics(brand.brandName_ja);  // codeからbrandName_jaに変更
    
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
    // 検索中やロード中はサジェストを表示しない
    if (!isSearching && !isLoading && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions, isSearching, isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" onClick={handleClickOutside}>
      <div className="max-w-md mx-auto pt-16 px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">メルカリ価格検索</h1>
        
        <div className="relative" onClick={e => e.stopPropagation()}>
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