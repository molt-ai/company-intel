export interface CFPBData {
  totalComplaints: number;
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
    // First get aggregate data
    const baseUrl = 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/';
    
    // Get complaints with search_term for flexible matching
    const searchParams = new URLSearchParams({
      search_term: companyName,
      size: '25',
      sort: 'created_date_desc',
      no_aggs: 'false',
    });
    
    const res = await fetch(`${baseUrl}?${searchParams}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) throw new Error(`CFPB: ${res.status}`);
    const data = await res.json();
    
    const hits = data.hits?.hits || [];
    const rawTotal = data.hits?.total;
    const total = typeof rawTotal === 'object' ? (rawTotal?.value || 0) : (rawTotal || 0);
    const aggs = data.aggregations || {};
    
    // Extract products
    const products: Array<{ name: string; count: number }> = [];
    const productBuckets = aggs.product?.product?.buckets || [];
    for (const bucket of productBuckets.slice(0, 10)) {
      products.push({ name: bucket.key, count: bucket.doc_count });
    }
    
    // Extract issues
    const issues: Array<{ name: string; count: number }> = [];
    const issueBuckets = aggs.issue?.issue?.buckets || [];
    for (const bucket of issueBuckets.slice(0, 10)) {
      issues.push({ name: bucket.key, count: bucket.doc_count });
    }
    
    // Extract timely response
    const timelyBuckets = aggs.timely?.timely?.buckets || [];
    const yesBucket = timelyBuckets.find((b: { key: string }) => b.key === 'Yes');
    const totalTimely = timelyBuckets.reduce((sum: number, b: { doc_count: number }) => sum + b.doc_count, 0);
    const timelyResponseRate = totalTimely > 0 ? ((yesBucket?.doc_count || 0) / totalTimely) * 100 : 0;
    
    // Extract disputed
    const disputedBuckets = aggs.consumer_disputed?.consumer_disputed?.buckets || [];
    const disputedYes = disputedBuckets.find((b: { key: string }) => b.key === 'Yes');
    const totalDisputed = disputedBuckets.reduce((sum: number, b: { doc_count: number }) => sum + b.doc_count, 0);
    const disputedRate = totalDisputed > 0 ? ((disputedYes?.doc_count || 0) / totalDisputed) * 100 : 0;
    
    // Extract complaints by year
    const yearBuckets = aggs.date_received_min?.date_received_min?.buckets || [];
    const complaintsByYear: Array<{ year: number; count: number }> = yearBuckets
      .map((b: { key_as_string: string; doc_count: number }) => ({
        year: new Date(b.key_as_string).getFullYear(),
        count: b.doc_count,
      }))
      .sort((a: { year: number }, b: { year: number }) => b.year - a.year)
      .slice(0, 5);
    
    // Recent complaints
    const recentComplaints = hits.slice(0, 10).map((hit: { _source: Record<string, string | boolean> }) => ({
      date: hit._source.date_received || '',
      product: hit._source.product || '',
      issue: hit._source.issue || '',
      companyResponse: hit._source.company_response || '',
      timely: hit._source.timely === 'Yes',
    }));
    
    return {
      totalComplaints: total,
      products,
      issues,
      timelyResponseRate: Math.round(timelyResponseRate * 10) / 10,
      disputedRate: Math.round(disputedRate * 10) / 10,
      recentComplaints,
      complaintsByYear,
    };
  } catch (err) {
    console.error('CFPB error:', err);
    return null;
  }
}
