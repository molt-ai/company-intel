export interface CFPBData {
  totalComplaints: number;
  companyName: string;
  products: Array<{ name: string; count: number }>;
  issues: Array<{ name: string; count: number }>;
  timelyResponseRate: number;
  disputedRate: number;
  recentComplaints: Array<{
    date: string;
    product: string;
    issue: string;
    companyResponse: string;
    timely: boolean;
  }>;
  complaintsByYear: Array<{ year: number; count: number }>;
}

export async function getCFPBData(companyName: string): Promise<CFPBData | null> {
  try {
    const baseUrl = 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/';
    
    // Step 1: Use suggest/typeahead to find the exact CFPB company name
    const suggestRes = await fetch(
      `${baseUrl}_suggest_company?text=${encodeURIComponent(companyName)}&size=5`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    let exactCompanyName = companyName;
    
    if (suggestRes.ok) {
      const suggestData = await suggestRes.json();
      // The suggest endpoint returns a simple string array
      const suggestions: string[] = Array.isArray(suggestData) ? suggestData : [];
      if (suggestions.length > 0) {
        // Pick the best match
        const queryLower = companyName.toLowerCase();
        const match = suggestions.find((s: string) => 
          s.toLowerCase().includes(queryLower) || queryLower.includes(s.toLowerCase())
        ) || suggestions[0];
        exactCompanyName = match;
      }
    }
    
    // Step 2: Search with exact company name
    const searchParams = new URLSearchParams({
      company: exactCompanyName,
      size: '25',
      sort: 'created_date_desc',
      no_aggs: 'false',
    });
    
    const res = await fetch(`${baseUrl}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      // Fallback: try search_term but with smaller scope
      const fallbackParams = new URLSearchParams({
        search_term: companyName,
        size: '25',
        sort: 'created_date_desc',
        no_aggs: 'false',
      });
      
      const fallbackRes = await fetch(`${baseUrl}?${fallbackParams}`, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!fallbackRes.ok) throw new Error(`CFPB: ${fallbackRes.status}`);
      const fallbackData = await fallbackRes.json();
      return parseCFPBResponse(fallbackData, companyName);
    }
    
    const data = await res.json();
    return parseCFPBResponse(data, exactCompanyName);
  } catch (err) {
    console.error('CFPB error:', err);
    return null;
  }
}

function parseCFPBResponse(data: Record<string, unknown>, companyName: string): CFPBData {
  const hitsObj = data.hits as Record<string, unknown> || {};
  const hits = (hitsObj.hits || []) as Array<{ _source: Record<string, string | boolean> }>;
  const rawTotal = hitsObj.total;
  const total = typeof rawTotal === 'object' ? ((rawTotal as Record<string, number>)?.value || 0) : (Number(rawTotal) || 0);
  const aggs = (data.aggregations || {}) as Record<string, Record<string, Record<string, Array<Record<string, string | number>>>>>;
  
  // Extract products
  const products: Array<{ name: string; count: number }> = [];
  const productBuckets = aggs.product?.product?.buckets || [];
  for (const bucket of productBuckets.slice(0, 10)) {
    products.push({ name: String(bucket.key), count: Number(bucket.doc_count) });
  }
  
  // Extract issues
  const issues: Array<{ name: string; count: number }> = [];
  const issueBuckets = aggs.issue?.issue?.buckets || [];
  for (const bucket of issueBuckets.slice(0, 10)) {
    issues.push({ name: String(bucket.key), count: Number(bucket.doc_count) });
  }
  
  // Extract timely response
  const timelyBuckets = aggs.timely?.timely?.buckets || [];
  const yesBucket = timelyBuckets.find((b) => b.key === 'Yes');
  const totalTimely = timelyBuckets.reduce((sum: number, b) => sum + Number(b.doc_count), 0);
  const timelyResponseRate = totalTimely > 0 ? (Number(yesBucket?.doc_count || 0) / totalTimely) * 100 : 0;
  
  // Extract disputed
  const disputedBuckets = aggs.consumer_disputed?.consumer_disputed?.buckets || [];
  const disputedYes = disputedBuckets.find((b) => b.key === 'Yes');
  const totalDisputed = disputedBuckets.reduce((sum: number, b) => sum + Number(b.doc_count), 0);
  const disputedRate = totalDisputed > 0 ? (Number(disputedYes?.doc_count || 0) / totalDisputed) * 100 : 0;
  
  // Extract complaints by year
  const yearBuckets = aggs.date_received_min?.date_received_min?.buckets || [];
  const complaintsByYear: Array<{ year: number; count: number }> = yearBuckets
    .map((b) => ({
      year: new Date(String(b.key_as_string)).getFullYear(),
      count: Number(b.doc_count),
    }))
    .sort((a: { year: number }, b: { year: number }) => b.year - a.year)
    .slice(0, 5);
  
  // Recent complaints
  const recentComplaints = hits.slice(0, 10).map((hit) => ({
    date: String(hit._source.date_received || ''),
    product: String(hit._source.product || ''),
    issue: String(hit._source.issue || ''),
    companyResponse: String(hit._source.company_response || ''),
    timely: hit._source.timely === 'Yes',
  }));
  
  return {
    totalComplaints: total,
    companyName,
    products,
    issues,
    timelyResponseRate: Math.round(timelyResponseRate * 10) / 10,
    disputedRate: Math.round(disputedRate * 10) / 10,
    recentComplaints,
    complaintsByYear,
  };
}
