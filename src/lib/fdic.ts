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
    insuredStatus: string;
    returnOnAssets: number;
    equityCapitalRatio: number;
  }>;
  found: boolean;
}

export async function getFDICData(companyName: string): Promise<FDICData | null> {
  try {
    const params = new URLSearchParams({
      filters: `INSTNAME:"${companyName}"`,
      fields: 'INSTNAME,CERT,CITY,STNAME,ASSET,DEP,NETINC,ESTYMD,ACTIVE,REGAGENT,CHRTAGNT,INSTCAT,REPDTE,ROA,EQCAPRT',
      limit: '10',
      sort_by: 'ASSET',
      sort_order: 'DESC',
    });
    
    const res = await fetch(`https://banks.data.fdic.gov/api/financials?${params}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      // Try institutions endpoint
      const params2 = new URLSearchParams({
        filters: `INSTNAME:"${companyName}"`,
        fields: 'INSTNAME,CERT,CITY,STALP,ASSET,DEP,NETINC,ESTYMD,ACTIVE,REGAGENT',
        limit: '10',
        sort_by: 'ASSET',
        sort_order: 'DESC',
      });
      
      const res2 = await fetch(`https://banks.data.fdic.gov/api/institutions?${params2}`);
      if (!res2.ok) throw new Error(`FDIC: ${res2.status}`);
      const data2 = await res2.json();
      
      const institutions = (data2.data || []).map((item: { data: Record<string, string | number | boolean> }) => {
        const d = item.data;
        return {
          name: String(d.INSTNAME || ''),
          certNumber: String(d.CERT || ''),
          city: String(d.CITY || ''),
          state: String(d.STALP || d.STNAME || ''),
          totalAssets: Number(d.ASSET || 0) * 1000,
          totalDeposits: Number(d.DEP || 0) * 1000,
          netIncome: Number(d.NETINC || 0) * 1000,
          established: String(d.ESTYMD || ''),
          activeFlag: d.ACTIVE === 1 || d.ACTIVE === '1',
          regulatorName: String(d.REGAGENT || ''),
          charterClass: '',
          insuredStatus: '',
          returnOnAssets: 0,
          equityCapitalRatio: 0,
        };
      });
      
      return { institutions, found: institutions.length > 0 };
    }
    
    const data = await res.json();
    const institutions = (data.data || []).map((item: { data: Record<string, string | number | boolean> }) => {
      const d = item.data;
      return {
        name: String(d.INSTNAME || ''),
        certNumber: String(d.CERT || ''),
        city: String(d.CITY || ''),
        state: String(d.STNAME || ''),
        totalAssets: Number(d.ASSET || 0) * 1000,
        totalDeposits: Number(d.DEP || 0) * 1000,
        netIncome: Number(d.NETINC || 0) * 1000,
        established: String(d.ESTYMD || ''),
        activeFlag: d.ACTIVE === 1,
        regulatorName: String(d.REGAGENT || ''),
        charterClass: String(d.CHRTAGNT || ''),
        insuredStatus: String(d.INSTCAT || ''),
        returnOnAssets: Number(d.ROA || 0),
        equityCapitalRatio: Number(d.EQCAPRT || 0),
      };
    });
    
    return { institutions, found: institutions.length > 0 };
  } catch (err) {
    console.error('FDIC error:', err);
    return null;
  }
}
