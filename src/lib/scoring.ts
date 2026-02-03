import { CFPBData } from './cfpb';
import { EPAData } from './epa';
import { OSHAData } from './osha';
import { SECCompany } from './sec';

export interface TrustScore {
  overall: number;
  grade: string;
  gradeColor: string;
  categories: {
    consumerComplaints: { score: number; weight: number; details: string };
    environmentalCompliance: { score: number; weight: number; details: string };
    workplaceSafety: { score: number; weight: number; details: string };
    regulatoryFiling: { score: number; weight: number; details: string };
  };
}

export function calculateTrustScore(
  sec: SECCompany | null,
  cfpb: CFPBData | null,
  epa: EPAData | null,
  osha: OSHAData | null,
): TrustScore {
  const categories = {
    consumerComplaints: scoreCFPB(cfpb),
    environmentalCompliance: scoreEPA(epa),
    workplaceSafety: scoreOSHA(osha),
    regulatoryFiling: scoreSEC(sec),
  };
  
  const totalWeight = Object.values(categories).reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = Object.values(categories).reduce((sum, c) => sum + c.score * c.weight, 0);
  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
  
  return {
    overall,
    grade: getGrade(overall),
    gradeColor: getGradeColor(overall),
    categories,
  };
}

function scoreCFPB(data: CFPBData | null): { score: number; weight: number; details: string } {
  if (!data) return { score: 70, weight: 0.5, details: 'No consumer complaint data available' };
  
  const total = data.totalComplaints;
  let score = 90;
  
  // Penalty for high complaint volumes
  if (total > 10000) score -= 30;
  else if (total > 5000) score -= 20;
  else if (total > 1000) score -= 15;
  else if (total > 100) score -= 5;
  
  // Bonus for high timely response rate
  if (data.timelyResponseRate >= 98) score += 5;
  else if (data.timelyResponseRate >= 95) score += 2;
  else if (data.timelyResponseRate < 80) score -= 10;
  
  // Penalty for high dispute rate
  if (data.disputedRate > 30) score -= 10;
  else if (data.disputedRate > 20) score -= 5;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    weight: 1,
    details: `${total.toLocaleString()} complaints, ${data.timelyResponseRate}% timely response`,
  };
}

function scoreEPA(data: EPAData | null): { score: number; weight: number; details: string } {
  if (!data || data.totalFacilities === 0) return { score: 75, weight: 0.5, details: 'No EPA facility data' };
  
  let score = 90;
  
  // Penalty for violations
  if (data.totalViolations > 50) score -= 30;
  else if (data.totalViolations > 20) score -= 20;
  else if (data.totalViolations > 5) score -= 10;
  else if (data.totalViolations > 0) score -= 5;
  
  // Penalty for monetary penalties
  if (data.totalPenalties > 1000000) score -= 20;
  else if (data.totalPenalties > 100000) score -= 10;
  else if (data.totalPenalties > 10000) score -= 5;
  
  // Bonus for high compliance rate
  if (data.complianceRate >= 95) score += 5;
  else if (data.complianceRate < 50) score -= 15;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    weight: 1,
    details: `${data.totalFacilities} facilities, ${data.totalViolations} violations, $${data.totalPenalties.toLocaleString()} in penalties`,
  };
}

function scoreOSHA(data: OSHAData | null): { score: number; weight: number; details: string } {
  if (!data || data.totalInspections === 0) return { score: 75, weight: 0.5, details: 'No OSHA inspection data' };
  
  let score = 85;
  
  // Willful violations are very serious
  if (data.willfulViolationCount > 0) score -= 25;
  
  // Serious violations
  if (data.seriousViolationCount > 20) score -= 20;
  else if (data.seriousViolationCount > 10) score -= 15;
  else if (data.seriousViolationCount > 0) score -= 5;
  
  // Penalties
  if (data.totalPenalties > 500000) score -= 15;
  else if (data.totalPenalties > 100000) score -= 10;
  else if (data.totalPenalties > 10000) score -= 5;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    weight: 1,
    details: `${data.totalInspections} inspections, ${data.totalViolations} violations, $${data.totalPenalties.toLocaleString()} penalties`,
  };
}

function scoreSEC(data: SECCompany | null): { score: number; weight: number; details: string } {
  if (!data) return { score: 50, weight: 0.5, details: 'No SEC filing data' };
  
  let score = 85;
  
  // Check recent filing activity
  const recentFilings = data.recentFilings.filter(f => {
    const d = new Date(f.filingDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return d > oneYearAgo;
  });
  
  if (recentFilings.length > 5) score += 10;
  else if (recentFilings.length > 0) score += 5;
  else score -= 15;
  
  // Check for 10-K (annual report)
  const has10K = data.recentFilings.some(f => f.form === '10-K');
  if (has10K) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    weight: 0.75,
    details: `${data.recentFilings.length} recent filings, CIK: ${data.cik}`,
  };
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#34d399';
  if (score >= 70) return '#fbbf24';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}
