// app/api/monthly-analytics/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // api.tsで定義されているAPI_URLを使用
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyFMiCOFc-SLbsKqrUFbI6mYfT47F0Z3yzOI3lmin5ud7C4UDzxQ4DRHzc2dFD4JlY3/exec?action=monthlyAnalytics'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const data = JSON.parse(text.substring(jsonStart));

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Monthly analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}