export interface FDICData {
  institutions: Array<{
    name: string;
    certNumber: string;
    city: string;
    state: string;
    totalAssets: number;
    totalDeposits: number;
    netIncome: number;
    established: string;
    activeFlag: boolean;
    regulatorName: string;
    charterClass: string;
    returnOnAssets: number;
    equityCapitalRatio: number;
  }>;
  found: boolean;
}

export async function getFDICData(companyName: string): Promise<FDICData | null> {
  try {
    // FDIC API uses NAME field, and we need to use filters syntax
    // Try first with exact-ish filter, then broader
    const fields = 'NAME,CERT,CITY,STALP,ASSET,DEP,NETINC,ESTYMD,ACTIVE,REGAGENT,BKCLASS,ROA';
    
    // Try multiple approaches
    const urls = [
      `https://banks.data.fdic.gov/api/financials?filters=REPDTE%3A20240930%20AND%20INSTNAME%3A%22${encodeURIComponent(companyName)}%22&fields=INSTNAME,CERT,ASSET,DEP,NETINC,ROA,EQCAPRT&limit=10&sort_by=ASSET&sort_order=DESC`,
      `https://banks.data.fdic.gov/api/institutions?filters=ACTIVE%3A1%20AND%20NAME%3A%22${encodeURIComponent(companyName)}%22&fields=${fields}&limit=10&sort_by=ASSET&sort_order=DESC`,
      `https://banks.data.fdic.gov/api/institutions?filters=ACTIVE%3A1%20AND%20NAMEHCR%3A%22${encodeURIComponent(companyName.toUpperCase())}%22&fields=${fields}&limit=10&sort_by=ASSET&sort_order=DESC`,
    ];
    
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) continue;
        
        const data = await res.json();
        const items = data.data || [];
        
        if (items.length > 0) {
          const institutions = items.map((item: { data: Record<string, string | number | boolean> }) => {
            const d = item.data;
            return {
              name: String(d.NAME || d.INSTNAME || ''),
              certNumber: String(d.CERT || ''),
              city: String(d.CITY || ''),
              state: String(d.STALP || d.STNAME || ''),
              totalAssets: Number(d.ASSET || 0) * 1000, // FDIC reports in thousands
              totalDeposits: Number(d.DEP || 0) * 1000,
              netIncome: Number(d.NETINC || 0) * 1000,
              established: String(d.ESTYMD || ''),
              activeFlag: d.ACTIVE === 1 || d.ACTIVE === '1' || d.ACTIVE === true,
              regulatorName: String(d.REGAGENT || ''),
              charterClass: String(d.BKCLASS || ''),
              returnOnAssets: Number(d.ROA || 0),
              equityCapitalRatio: Number(d.EQCAPRT || 0),
            };
          });
          
          return { institutions, found: true };
        }
      } catch {
        continue;
      }
    }
    
    return { institutions: [], found: false };
  } catch (err) {
    console.error('FDIC error:', err);
    return null;
  }
}
