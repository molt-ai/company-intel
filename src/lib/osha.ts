export interface OSHAData {
  inspections: Array<{
    activityNr: string;
    establishmentName: string;
    site: string;
    city: string;
    state: string;
    openDate: string;
    closeDate: string;
    inspType: string;
    totalPenalty: number;
    seriousViolations: number;
    willfulViolations: number;
    otherViolations: number;
  }>;
  totalInspections: number;
  totalViolations: number;
  totalPenalties: number;
  seriousViolationCount: number;
  willfulViolationCount: number;
}

export async function getOSHAData(companyName: string): Promise<OSHAData | null> {
  try {
    // Use the DOL Open Data Portal (data.dol.gov) API
    const encodedName = encodeURIComponent(companyName);
    
    // Try the new data.dol.gov API
    const res = await fetch(
      `https://data.dol.gov/get/inspection/search/${encodedName}/limit/25/orderby/open_date/desc`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return parseOSHAResponse(data);
      }
    }
    
    // If that fails, return null (API may not be accessible)
    return null;
  } catch (err) {
    console.error('OSHA error:', err);
    return null;
  }
}

function parseOSHAResponse(results: Array<Record<string, string | number>>): OSHAData {
  const inspections = results.map((r) => ({
    activityNr: String(r.activity_nr || r.activityNr || ''),
    establishmentName: String(r.estab_name || r.establishment_name || r.estabName || ''),
    site: String(r.site_address || r.siteAddress || ''),
    city: String(r.site_city || r.siteCity || ''),
    state: String(r.site_state || r.siteState || ''),
    openDate: String(r.open_date || r.openDate || ''),
    closeDate: String(r.close_case_date || r.closeDate || ''),
    inspType: String(r.insp_type || r.inspType || ''),
    totalPenalty: parseFloat(String(r.total_current_penalty || r.totalCurrentPenalty || r.penalty || 0)) || 0,
    seriousViolations: parseInt(String(r.serious_violations || r.nr_serious || 0)) || 0,
    willfulViolations: parseInt(String(r.willful_violations || r.nr_willful || 0)) || 0,
    otherViolations: parseInt(String(r.other_violations || r.nr_other || 0)) || 0,
  }));
  
  const totalViolations = inspections.reduce(
    (sum, i) => sum + i.seriousViolations + i.willfulViolations + i.otherViolations, 0
  );
  const totalPenalties = inspections.reduce((sum, i) => sum + i.totalPenalty, 0);
  const seriousCount = inspections.reduce((sum, i) => sum + i.seriousViolations, 0);
  const willfulCount = inspections.reduce((sum, i) => sum + i.willfulViolations, 0);
  
  return {
    inspections,
    totalInspections: inspections.length,
    totalViolations,
    totalPenalties,
    seriousViolationCount: seriousCount,
    willfulViolationCount: willfulCount,
  };
}
