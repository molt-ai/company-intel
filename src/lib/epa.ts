export interface EPAData {
  facilities: Array<{
    name: string;
    registryId: string;
    address: string;
    city: string;
    state: string;
    complianceStatus: string;
    lastInspection: string;
    inspectionCount: number;
    penalties: number;
    programs: string[];
    sncFlag: string;
  }>;
  totalFacilities: number;
  totalViolations: number;
  totalPenalties: number;
  complianceRate: number;
}

export async function getEPAData(companyName: string): Promise<EPAData | null> {
  try {
    // Phase 1: Get QueryID
    const searchParams = new URLSearchParams({
      output: 'JSON',
      p_fn: companyName,
    });
    
    const searchRes = await fetch(
      `https://echodata.epa.gov/echo/echo_rest_services.get_facilities?${searchParams}`
    );
    
    if (!searchRes.ok) throw new Error(`EPA ECHO search: ${searchRes.status}`);
    const searchData = await searchRes.json();
    
    const results = searchData?.Results || {};
    const queryId = results.QueryID;
    const totalCount = parseInt(String(results.QueryRows || '0')) || 0;
    
    if (!queryId || totalCount === 0) {
      return {
        facilities: [],
        totalFacilities: 0,
        totalViolations: 0,
        totalPenalties: 0,
        complianceRate: 100,
      };
    }
    
    // Parse total penalties from the search results
    const totalPenaltiesStr = String(results.TotalPenalties || '$0');
    const totalPenalties = parseFloat(totalPenaltiesStr.replace(/[$,]/g, '')) || 0;
    
    // Phase 2: Get facility details
    const qidParams = new URLSearchParams({
      output: 'JSON',
      qid: queryId,
      pageno: '1',
    });
    
    const qidRes = await fetch(
      `https://echodata.epa.gov/echo/echo_rest_services.get_qid?${qidParams}`
    );
    
    if (!qidRes.ok) throw new Error(`EPA ECHO qid: ${qidRes.status}`);
    const qidData = await qidRes.json();
    
    const facilityList = qidData?.Results?.Facilities || [];
    
    const facilities = facilityList.slice(0, 20).map((f: Record<string, string | null>) => {
      const programs: string[] = [];
      if (f.AIRFlag === 'Y' || f.CAAComplianceStatus) programs.push('Clean Air Act');
      if (f.CWAComplianceStatus) programs.push('Clean Water Act');
      if (f.RCRAComplianceStatus) programs.push('RCRA');
      if (f.SDWAComplianceStatus) programs.push('Safe Drinking Water');
      if (f.TRIFlag === 'Y') programs.push('TRI');
      
      return {
        name: f.FacName || '',
        registryId: f.RegistryID || '',
        address: f.FacStreet || '',
        city: f.FacCity || '',
        state: f.FacState || '',
        complianceStatus: f.FacComplianceStatus || 'Unknown',
        lastInspection: f.FacDateLastInspection || 'N/A',
        inspectionCount: parseInt(String(f.FacInspectionCount || '0')) || 0,
        penalties: parseFloat(String(f.CAAPenalties || '0').replace(/[$,]/g, '')) || 0,
        programs,
        sncFlag: f.FacSNCFlg || 'N',
      };
    });
    
    const sncCount = parseInt(String(results.SVRows || '0')) || 0;
    const totalViolations = sncCount + (parseInt(String(results.CVRows || '0')) || 0);
    const complianceRate = totalCount > 0 ? Math.round(((totalCount - sncCount) / totalCount) * 100) : 100;
    
    return {
      facilities,
      totalFacilities: totalCount,
      totalViolations,
      totalPenalties,
      complianceRate,
    };
  } catch (err) {
    console.error('EPA error:', err);
    return null;
  }
}
