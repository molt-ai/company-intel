import { NextRequest, NextResponse } from 'next/server';
import { searchSECCompany } from '@/lib/sec';
import { getCached, setCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }
  
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<Array<{ cik: string; name: string; ticker: string }>>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }
  
  const results = await searchSECCompany(query);
  setCache(cacheKey, results, 60 * 60 * 1000); // 1 hour cache
  
  return NextResponse.json({ results });
}
