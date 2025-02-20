export interface TimeAnalysisData {
  dayOfWeek: {
    [key: string]: number;  // '日', '月', etc.
  };
  hourOfDay: number[];     // 24時間分の配列
  heatmap: {
    day: string;
    hour: number;
    count: number;
  }[];
}

// ヒートマップのデータ型
export interface HeatmapData {
  day: string;
  hour: number;
  count: number;
}

export function analyzeTimePatterns(dates: string[]): TimeAnalysisData {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayCount: { [key: string]: number } = {
    '日': 0, '月': 0, '火': 0, '水': 0, '木': 0, '金': 0, '土': 0
  };
  const hourCount = Array(24).fill(0);
  const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
  const timeZoneOffset = 9; // JST = UTC+9

  // デバッグ用カウンタ
  let processedCount = 0;
  let errorCount = 0;

  dates.forEach((isoDateStr, index) => {
    try {
      // UTCの日時を解析
      const utcDate = new Date(isoDateStr);
      
      // JSTの時間を計算
      const jstHours = (utcDate.getUTCHours() + timeZoneOffset) % 24;
      // JSTの日付を取得
      const jstDate = new Date(utcDate.getTime() + timeZoneOffset * 60 * 60 * 1000);
      const dayIndex = jstDate.getUTCDay();
      const weekDay = dayNames[dayIndex];

      // カウントを更新
      dayCount[weekDay]++;
      hourCount[jstHours]++;
      heatmapData[dayIndex][jstHours]++;
      processedCount++;

      // 最初の10件のデータについて詳細ログを出力
      if (index < 10) {
        console.log(`Processing ${isoDateStr}:`, {
          utcHours: utcDate.getUTCHours(),
          jstHours,
          weekDay,
          counts: {
            day: dayCount[weekDay],
            hour: hourCount[jstHours]
          }
        });
      }
    } catch (error) {
      console.error(`Error processing date ${isoDateStr}:`, error);
      errorCount++;
    }
  });

  // 処理サマリーのログ出力
  console.log('Time analysis summary:', {
    totalDates: dates.length,
    processedSuccessfully: processedCount,
    errors: errorCount,
    dayTotals: dayCount,
    hourTotals: hourCount
  });

  // ヒートマップデータの整形
  const heatmap = dayNames.flatMap((day, dayIndex) => 
    Array.from({length: 24}, (_, hour) => ({
      day,
      hour,
      count: heatmapData[dayIndex][hour]
    }))
  );

  return {
    dayOfWeek: dayCount,
    hourOfDay: hourCount,
    heatmap
  };
}