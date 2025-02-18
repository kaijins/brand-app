import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart2, TrendingUp, Image, ChevronDown } from 'lucide-react';
import { CategoryStats, AnalyticsData, MonthlyStats, PriceRangeAnalysis, ImageAnalysis } from '../types';


const MonthlyAnalysis = () => {
  // State hooks
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monthly-analytics');
        if (!response.ok) throw new Error('API request failed');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoized data processing
  const selectedData = useMemo(() => {
    if (!data) return null;
    
    if (selectedMonth === 'all') {
      return data;
    }

    const monthData = data.monthlyStats.find(
      stat => stat.month.toString() === selectedMonth
    );

    if (!monthData) return null;

    return {
      ...data,
      monthlyStats: [monthData]
    };
  }, [data, selectedMonth]);

  const monthOptions = useMemo(() => {
    if (!data) return [];
    return [
      { value: 'all', label: '全期間' },
      ...data.monthlyStats.map(stat => ({
        value: stat.month.toString(),
        label: `${stat.month}月`
      }))
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        データを読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 bg-gray-800 rounded-lg">
        エラーが発生しました: {error}
      </div>
    );
  }

  if (!data || !selectedData) return null;

  return (
    <div className="space-y-6 bg-gray-900">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-100">
            <BarChart2 className="h-6 w-6" />
            <h2 className="text-xl font-bold">月次分析データ</h2>
          </div>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2 pr-8 appearance-none cursor-pointer border border-gray-600 hover:border-gray-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* 概要データ */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h3 className="text-sm text-gray-400 mb-3">全体データ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">総データ件数</div>
                <div className="text-xl text-gray-100">
                  {data.totalDataCount.toLocaleString()}件
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">平均取引日数</div>
                <div className="text-xl text-gray-100">
                  {Math.round((data.imageAnalysis.withImage.avgDays + 
                    data.imageAnalysis.withoutImage.avgDays) / 2)}日
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h3 className="text-sm text-gray-400 mb-3">
              {selectedMonth === 'all' ? '全期間' : `${selectedMonth}月`}のデータ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">データ件数</div>
                <div className="text-xl text-gray-100">
                  {selectedData.monthlyStats[0].itemCount.toLocaleString()}件
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">平均価格</div>
                <div className="text-xl text-gray-100">
                  ¥{Math.round(selectedData.monthlyStats[0].averagePrice).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 月次データグラフ */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
          <h3 className="text-sm text-gray-400 mb-4">月次推移</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month"
                  tickFormatter={(value) => `${value}月`}
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    color: '#D1D5DB'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === '平均価格') return [`¥${value.toLocaleString()}`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="averagePrice"
                  stroke="#8B5CF6"
                  name="平均価格"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="itemCount"
                  stroke="#10B981"
                  name="取引件数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* カテゴリー別グラフ */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
          <h3 className="text-sm text-gray-400 mb-4">カテゴリー別取引状況</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedData.monthlyStats[0].categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="category" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    color: '#D1D5DB'
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" name="取引件数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* カテゴリー別詳細テーブル */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
  <h3 className="text-sm text-gray-400 mb-4">カテゴリー別詳細</h3>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead>
    <tr className="text-left text-gray-400 text-sm">{/* 空白を削除 */}
      <th className="pb-2 px-4 whitespace-nowrap">カテゴリー</th>
      <th className="pb-2 px-4">構成比</th>
      <th className="pb-2 px-4">前月比</th>
      <th className="pb-2 px-4">平均価格</th>
    </tr>
  </thead>
  <tbody className="text-gray-100">{/* 空白を削除 */}
    {selectedData.monthlyStats[0].categories
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .map(cat => (
        <tr key={cat.category} className="border-t border-gray-600">{/* 空白を削除 */}
          <td className="py-2 px-4">
            <div className="text-base font-medium">{cat.category}</div>
            <div className="text-xs text-gray-400">{cat.count}件</div>
          </td>
          <td className="py-2 px-4">
            <div className="text-base">{(cat.percentage || 0).toFixed(1)}%</div>
          </td>
          <td className="py-2 px-4">
            {typeof cat.percentageChange === 'number' ? (
              <div className={`text-base ${
                cat.percentageChange > 0 
                  ? 'text-green-400' 
                  : cat.percentageChange < 0 
                  ? 'text-red-400' 
                  : ''
              }`}>
                {cat.percentageChange > 0 ? '+' : ''}
                {cat.percentageChange.toFixed(1)}%
              </div>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </td>
          <td className="py-2 px-4">
            {typeof cat.averageRevenue === 'number' 
              ? (
                <div className="text-base">
                  ¥{Math.round(cat.averageRevenue).toLocaleString()}
                </div>
              )
              : '-'
            }
          </td>
        </tr>
      ))}
  </tbody>
</table>
  </div>
</div>

        {/* 着用画像の影響分析 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm text-gray-400">着用画像あり</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-100">
                <span>データ件数</span>
                <span>{selectedData.imageAnalysis.withImage.count}件</span>
              </div>
              <div className="flex justify-between text-gray-100">
                <span>平均価格</span>
                <span>¥{selectedData.imageAnalysis.withImage.avgPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-100">
                <span>平均販売日数</span>
                <span>{selectedData.imageAnalysis.withImage.avgDays}日</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm text-gray-400">着用画像なし</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-100">
                <span>データ件数</span>
                <span>{selectedData.imageAnalysis.withoutImage.count}件</span>
              </div>
              <div className="flex justify-between text-gray-100">
                <span>平均価格</span>
                <span>¥{selectedData.imageAnalysis.withoutImage.avgPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-100">
                <span>平均販売日数</span>
                <span>{selectedData.imageAnalysis.withoutImage.avgDays}日</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;