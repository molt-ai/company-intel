export interface USPTOData {
  patents: Array<{
    title: string;
    patentNumber: string;
    filingDate: string;
    grantDate: string;
    inventors: string[];
    abstract: string;
  }>;
  trademarks: Array<{
    name: string;
    serialNumber: string;
    registrationNumber: string;
    filingDate: string;
    status: string;
    description: string;
  }>;
  totalPatents: number;
  totalTrademarks: number;
  note: string;
}

export async function getUSPTOData(companyName: string): Promise<USPTOData | null> {
  try {
    // PatentsView API v1 is discontinued, v2 requires API key
    // Try to get basic patent assignment data from USPTO bulk data
    const patents = await fetchPatentAssignments(companyName);
    
    return {
      patents: patents.patents,
      trademarks: [],
      totalPatents: patents.total,
      totalTrademarks: 0,
      note: 'Patent data from USPTO assignment records. PatentsView API requires an API key for full search.',
    };
  } catch (err) {
    console.error('USPTO error:', err);
    return null;
  }
}

async function fetchPatentAssignments(companyName: string): Promise<{ patents: USPTOData['patents']; total: number }> {
  try {
    // Try the USPTO Patent Assignment Search
    const encodedName = encodeURIComponent(companyName);
    const res = await fetch(
      `https://assignment-api.uspto.gov/patent/lookup?query=${encodedName}&filter=OwnerName&rows=10&start=0`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!res.ok) {
      // Fallback: return empty
      return { patents: [], total: 0 };
    }
    
    const data = await res.json();
    const docs = data?.response?.docs || data?.patents || [];
    
    if (docs.length === 0) {
      return { patents: [], total: data?.response?.numFound || 0 };
    }
    
    const patents = docs.slice(0, 10).map((d: Record<string, string | string[]>) => ({
      title: String(d.inventionTitle || d.title || ''),
      patentNumber: String(d.patentNumber || d.patent_number || ''),
      filingDate: String(d.filingDate || ''),
      grantDate: String(d.grantDate || d.executionDate || ''),
      inventors: Array.isArray(d.inventors) ? d.inventors : [],
      abstract: '',
    }));
    
    return {
      patents,
      total: data?.response?.numFound || patents.length,
    };
  } catch (err) {
    console.error('USPTO patent assignment error:', err);
    return { patents: [], total: 0 };
  }
}
