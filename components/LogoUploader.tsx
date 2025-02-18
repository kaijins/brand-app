'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';  // 1行にまとめる
import { searchBrandsBasic } from '../utils/api';
import { saveLogo } from '../utils/logoDatabase';

interface BrandSelectorProps {
  onBrandSelect: (code: string, name: string) => void;
}

interface LogoUploaderProps {
  onClose: () => void;
}

// BrandSelector コンポーネント
const BrandSelector: React.FC<BrandSelectorProps> = ({ onBrandSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{code: string; brandName_ja: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await searchBrandsBasic(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Brand search error:', error);
    }
  };

  return (
    <div className="relative">  {/* mb-4 を削除 */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="ブランドを検索"
          className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 
                    text-sm text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-gray-700 rounded-lg shadow-lg z-10 border border-gray-600">
          {suggestions.map((brand) => (
            <div
              key={brand.code}
              className="p-2 hover:bg-gray-600 cursor-pointer text-sm text-gray-100"
              onClick={() => {
                onBrandSelect(brand.code, brand.brandName_ja);
                setShowSuggestions(false);
                setSearchQuery(brand.brandName_ja);
              }}
            >
              {brand.brandName_ja}
              <span className="text-gray-400 text-xs ml-2">({brand.code})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// LogoUploader メインコンポーネント
const LogoUploader: React.FC<LogoUploaderProps> = ({ onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<{code: string; name: string} | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBrand) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await saveLogo({
          id: Date.now().toString(),
          brandName: selectedBrand.name,
          brandCode: selectedBrand.code,
          imageData: base64String,
          uploadDate: new Date().toISOString()
        });

        alert('ロゴを保存しました！');
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-300">ロゴ画像の登録</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-400 hover:text-gray-300" />
        </button>
      </div>
  
      <div className="mt-6">  {/* margin-top を追加 */}
        <BrandSelector onBrandSelect={(code, name) => setSelectedBrand({ code, name })} />
      </div>
      
      {selectedBrand && (
        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700
                      file:disabled:opacity-50 file:disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};

export default LogoUploader;