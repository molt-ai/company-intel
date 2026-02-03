import { NextRequest, NextResponse } from 'next/server';
import { getSECCompanyData, getSECFinancials, searchSECCompany } from '@/lib/sec';
import { getCFPBData } from '@/lib/cfpb';
import { getEPAData } from '@/lib/epa';
import { getOSHAData } from '@/lib/osha';
import { getUSPTOData } from '@/lib/uspto';
import { getFDICData } from '@/lib/fdic';
import { calculateTrustScore } from '@/lib/scoring';
import { getCached, setCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const companyName = request.nextUrl.searchParams.get('company');
  const cik = request.nextUrl.searchParams.get('cik');
  
  if (!companyName) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
  }
  
  const cacheKey = `report:${companyName.toLowerCase()}:${cik || ''}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // If no CIK provided, search for it
  let resolvedCik = cik;
  let secSearchResults: Array<{ cik: string; name: string; ticker: string }> = [];
  
  if (!resolvedCik) {
    secSearchResults = await searchSECCompany(companyName);
    if (secSearchResults.length > 0) {
      resolvedCik = secSearchResults[0].cik;
    }
  }
  
  // Fetch all data sources in parallel
  const [secResult, financialsResult, cfpbResult, epaResult, oshaResult, usptoResult, fdicResult] = 
    await Promise.allSettled([
      resolvedCik ? getSECCompanyData(resolvedCik) : Promise.resolve(null),
      resolvedCik ? getSECFinancials(resolvedCik) : Promise.resolve(null),
      getCFPBData(companyName),
      getEPAData(companyName),
      getOSHAData(companyName),
      getUSPTOData(companyName),
      getFDICData(companyName),
    ]);
  
  const sec = secResult.status === 'fulfilled' ? secResult.value : null;
  const financials = financialsResult.status === 'fulfilled' ? financialsResult.value : null;
  const cfpb = cfpbResult.status === 'fulfilled' ? cfpbResult.value : null;
  const epa = epaResult.status === 'fulfilled' ? epaResult.value : null;
  const osha = oshaResult.status === 'fulfilled' ? oshaResult.value : null;
  const uspto = usptoResult.status === 'fulfilled' ? usptoResult.value : null;
  const fdic = fdicResult.status === 'fulfilled' ? fdicResult.value : null;
  
  const trustScore = calculateTrustScore(sec, cfpb, epa, osha);
  
  const report = {
    companyName: sec?.name || companyName,
    searchResults: secSearchResults,
    sec,
    financials,
    cfpb,
    epa,
    osha,
    uspto,
    fdic,
    trustScore,
    generatedAt: new Date().toISOString(),
    dataSources: {
      sec: sec !== null,
      financials: financials !== null,
      cfpb: cfpb !== null,
      epa: epa !== null,
      osha: osha !== null,
      uspto: uspto !== null,
      fdic: fdic !== null,
    },
  };
  
  setCache(cacheKey, report, 30 * 60 * 1000); // 30 min cache
  
  return NextResponse.json(report);
}
