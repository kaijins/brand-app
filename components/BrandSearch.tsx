'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import SearchResults from './SearchResults';
import { searchBrandsBasic, getBrandAnalytics, getAllBrands } from '../utils/api';

// 型定義を追加
interface Brand {
  code: string;
  brandName_ja: string;
  brandName_en: string;
  note?: string;
}

const BrandSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Brand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
            brand.brandName_en.toLowerCase() === normalizedInput ||
            brand.code.toLowerCase() === normalizedInput
          ),
          partial: results.filter((brand: Brand) => {
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
    <div className="min-h-screen bg-gray-900 text-gray-100" onClick={handleClickOutside}>
      <div className="max-w-md mx-auto pt-16 px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">メルカリ価格検索</h1>
        
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 text-center text-gray-400">読み込み中...</div>
        ) : (
          searchResults && searchResults.map((result: any, index: number) => (
            <SearchResults key={index} brandData={result} />
          ))
        )}
      </div>
    </div>
  );
};

export default BrandSearch;