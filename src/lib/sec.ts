const SEC_USER_AGENT = 'CompanyIntel/1.0 (esalvadorbot@icloud.com)';

const secHeaders = {
  'User-Agent': SEC_USER_AGENT,
  'Accept': 'application/json',
};

export interface SECCompany {
  cik: string;
  name: string;
  ticker: string;
  sic: string;
  sicDescription: string;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  addresses: {
    business: { street1: string; street2: string; city: string; stateOrCountry: string; zipCode: string };
    mailing: { street1: string; street2: string; city: string; stateOrCountry: string; zipCode: string };
  };
  officers: Array<{ name: string; title: string }>;
  recentFilings: Array<{ form: string; filingDate: string; primaryDocument: string; description: string }>;
  website: string;
  exchanges: string[];
  tickers: string[];
  ein: string;
}

export interface SECFinancials {
  revenue: Array<{ period: string; value: number; year: number }>;
  netIncome: Array<{ period: string; value: number; year: number }>;
  totalAssets: Array<{ period: string; value: number; year: number }>;
  totalLiabilities: Array<{ period: string; value: number; year: number }>;
  shareholdersEquity: Array<{ period: string; value: number; year: number }>;
}

export async function searchSECCompany(query: string): Promise<Array<{ cik: string; name: string; ticker: string }>> {
  try {
    // Use the company tickers JSON for fast lookup
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: secHeaders,
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`SEC tickers: ${res.status}`);
    const data = await res.json();
    
    const queryLower = query.toLowerCase();
    const results: Array<{ cik: string; name: string; ticker: string }> = [];
    
    for (const key of Object.keys(data)) {
      const entry = data[key];
      const name = (entry.title || '').toLowerCase();
      const ticker = (entry.ticker || '').toLowerCase();
      if (name.includes(queryLower) || ticker === queryLower) {
        results.push({
          cik: String(entry.cik_str).padStart(10, '0'),
          name: entry.title,
          ticker: entry.ticker,
        });
      }
      if (results.length >= 10) break;
    }
    
    return results;
  } catch (err) {
    console.error('SEC search error:', err);
    return [];
  }
}

export async function getSECCompanyData(cik: string): Promise<SECCompany | null> {
  try {
    const paddedCik = cik.padStart(10, '0');
    const res = await fetch(`https://data.sec.gov/submissions/CIK${paddedCik}.json`, {
      headers: secHeaders,
    });
    if (!res.ok) throw new Error(`SEC submissions: ${res.status}`);
    const data = await res.json();
    
    const recentFilings = (data.filings?.recent || data.filings?.files?.[0] || {});
    const filings: SECCompany['recentFilings'] = [];
    
    const forms = recentFilings.form || [];
    const dates = recentFilings.filingDate || [];
    const docs = recentFilings.primaryDocument || [];
    const descs = recentFilings.primaryDocDescription || [];
    
    for (let i = 0; i < Math.min(forms.length, 20); i++) {
      filings.push({
        form: forms[i],
        filingDate: dates[i],
        primaryDocument: docs[i],
        description: descs[i] || '',
      });
    }

    // Extract officers from former names or company officers if available  
    const officers: Array<{ name: string; title: string }> = [];
    // Company officers aren't always in submissions, but sometimes they are
    // We'll try to get them from the data
    
    return {
      cik: paddedCik,
      name: data.name || '',
      ticker: data.tickers?.[0] || '',
      sic: data.sic || '',
      sicDescription: data.sicDescription || '',
      stateOfIncorporation: data.stateOfIncorporation || '',
      fiscalYearEnd: data.fiscalYearEnd || '',
      addresses: {
        business: data.addresses?.business || { street1: '', street2: '', city: '', stateOrCountry: '', zipCode: '' },
        mailing: data.addresses?.mailing || { street1: '', street2: '', city: '', stateOrCountry: '', zipCode: '' },
      },
      officers,
      recentFilings: filings,
      website: data.website || '',
      exchanges: data.exchanges || [],
      tickers: data.tickers || [],
      ein: data.ein || '',
    };
  } catch (err) {
    console.error('SEC company data error:', err);
    return null;
  }
}

export async function getSECFinancials(cik: string): Promise<SECFinancials | null> {
  try {
    const paddedCik = cik.padStart(10, '0');
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`, {
      headers: secHeaders,
    });
    if (!res.ok) throw new Error(`SEC XBRL: ${res.status}`);
    const data = await res.json();
    
    const facts = data.facts || {};
    const usGaap = facts['us-gaap'] || {};
    
    function extractFact(conceptName: string): Array<{ period: string; value: number; year: number }> {
      const concept = usGaap[conceptName];
      if (!concept) return [];
      
      const units = concept.units || {};
      const usdEntries = units['USD'] || [];
      
      // Get annual (10-K) entries, deduplicated by year
      const annualEntries = usdEntries
        .filter((e: { form: string }) => e.form === '10-K' || e.form === '10-K/A')
        .sort((a: { end: string }, b: { end: string }) => b.end.localeCompare(a.end));
      
      const seen = new Set<number>();
      const results: Array<{ period: string; value: number; year: number }> = [];
      
      for (const entry of annualEntries) {
        const year = new Date(entry.end).getFullYear();
        if (seen.has(year)) continue;
        seen.add(year);
        results.push({
          period: entry.end,
          value: entry.val,
          year,
        });
        if (results.length >= 5) break;
      }
      
      return results;
    }
    
    // Pick the revenue concept with the most recent data
    const revenueCandidates = [
      extractFact('RevenueFromContractWithCustomerExcludingAssessedTax'),
      extractFact('RevenueFromContractWithCustomerIncludingAssessedTax'),
      extractFact('Revenues'),
      extractFact('SalesRevenueNet'),
      extractFact('SalesRevenueGoodsNet'),
    ];
    const revenue = revenueCandidates
      .filter(r => r.length > 0)
      .sort((a, b) => (b[0]?.year || 0) - (a[0]?.year || 0))[0] || [];
    
    return {
      revenue,
      netIncome: extractFact('NetIncomeLoss'),
      totalAssets: extractFact('Assets'),
      totalLiabilities: extractFact('Liabilities'),
      shareholdersEquity: extractFact('StockholdersEquity'),
    };
  } catch (err) {
    console.error('SEC financials error:', err);
    return null;
  }
}
