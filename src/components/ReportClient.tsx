'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TrustScoreRing from './TrustScoreRing';
import CollapsibleSection from './CollapsibleSection';
import SearchBar from './SearchBar';
import Link from 'next/link';

interface Report {
  companyName: string;
  sec: {
    name: string;
    ticker: string;
    cik: string;
    sic: string;
    sicDescription: string;
    stateOfIncorporation: string;
    fiscalYearEnd: string;
    ein: string;
    website: string;
    exchanges: string[];
    tickers: string[];
    addresses: {
      business: { street1: string; city: string; stateOrCountry: string; zipCode: string };
    };
    recentFilings: Array<{ form: string; filingDate: string; description: string }>;
  } | null;
  financials: {
    revenue: Array<{ period: string; value: number; year: number }>;
    netIncome: Array<{ period: string; value: number; year: number }>;
    totalAssets: Array<{ period: string; value: number; year: number }>;
    totalLiabilities: Array<{ period: string; value: number; year: number }>;
    shareholdersEquity: Array<{ period: string; value: number; year: number }>;
  } | null;
  cfpb: {
    totalComplaints: number;
    products: Array<{ name: string; count: number }>;
    issues: Array<{ name: string; count: number }>;
    timelyResponseRate: number;
    disputedRate: number;
    recentComplaints: Array<{ date: string; product: string; issue: string; companyResponse: string; timely: boolean }>;
    complaintsByYear: Array<{ year: number; count: number }>;
  } | null;
  epa: {
    facilities: Array<{
      name: string; address: string; city: string; state: string;
      complianceStatus: string; lastInspection: string; violationCount: number;
      penalties: number; programs: string[];
    }>;
    totalFacilities: number;
    totalViolations: number;
    totalPenalties: number;
    complianceRate: number;
  } | null;
  osha: {
    inspections: Array<{
      establishmentName: string; city: string; state: string;
      openDate: string; inspType: string; totalPenalty: number;
      seriousViolations: number; willfulViolations: number; otherViolations: number;
    }>;
    totalInspections: number;
    totalViolations: number;
    totalPenalties: number;
    seriousViolationCount: number;
    willfulViolationCount: number;
  } | null;
  uspto: {
    patents: Array<{ title: string; patentNumber: string; grantDate: string; abstract: string }>;
    trademarks: Array<{ name: string; status: string; filingDate: string }>;
    totalPatents: number;
    totalTrademarks: number;
  } | null;
  fdic: {
    institutions: Array<{
      name: string; certNumber: string; city: string; state: string;
      totalAssets: number; totalDeposits: number; netIncome: number;
      established: string; activeFlag: boolean; regulatorName: string;
      returnOnAssets: number; equityCapitalRatio: number;
    }>;
    found: boolean;
  } | null;
  trustScore: {
    overall: number;
    grade: string;
    gradeColor: string;
    categories: Record<string, { score: number; weight: number; details: string }>;
  };
  dataSources: Record<string, boolean>;
  generatedAt: string;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportClient() {
  const searchParams = useSearchParams();
  const companyName = searchParams.get('name') || '';
  const cik = searchParams.get('cik') || '';
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!companyName) return;
    
    setLoading(true);
    setError('');
    
    const params = new URLSearchParams({ company: companyName });
    if (cik) params.set('cik', cik);
    
    fetch(`/api/company-report?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch report');
        return res.json();
      })
      .then(data => setReport(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [companyName, cik]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-6"></div>
          <p className="text-gray-400 text-lg">Analyzing {companyName}...</p>
          <p className="text-gray-600 text-sm mt-2">Fetching data from SEC, CFPB, EPA, OSHA, USPTO...</p>
        </div>
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error || 'No data found'}</p>
          <Link href="/" className="text-teal-400 hover:text-teal-300 transition-colors">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }
  
  const { sec, financials, cfpb, epa, osha, uspto, fdic, trustScore, dataSources } = report;
  
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-teal-400 text-xl">🏢</span>
            <span className="text-white font-bold hidden sm:inline">CompanyIntel</span>
          </Link>
          <SearchBar />
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {sec?.name || report.companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {sec?.tickers?.map(t => (
                  <span key={t} className="text-teal-400 font-mono font-semibold bg-teal-500/10 px-3 py-1 rounded-lg text-sm">
                    {t}
                  </span>
                ))}
                {sec?.sic && (
                  <span className="text-gray-400 text-sm bg-white/[0.04] px-3 py-1 rounded-lg">
                    SIC: {sec.sic} — {sec.sicDescription}
                  </span>
                )}
                {sec?.stateOfIncorporation && (
                  <span className="text-gray-400 text-sm bg-white/[0.04] px-3 py-1 rounded-lg">
                    Inc. in {sec.stateOfIncorporation}
                  </span>
                )}
              </div>
              {sec?.addresses?.business && (
                <p className="text-gray-500 text-sm">
                  📍 {[sec.addresses.business.street1, sec.addresses.business.city, sec.addresses.business.stateOrCountry, sec.addresses.business.zipCode].filter(Boolean).join(', ')}
                </p>
              )}
              {sec?.ein && <p className="text-gray-500 text-sm mt-1">EIN: {sec.ein}</p>}
            </div>
            <div className="flex flex-col items-center">
              <p className="text-gray-400 text-sm mb-2 font-medium">Trust Score</p>
              <TrustScoreRing
                score={trustScore.overall}
                grade={trustScore.grade}
                gradeColor={trustScore.gradeColor}
              />
            </div>
          </div>
        </div>
        
        {/* Score Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Object.entries(trustScore.categories).map(([key, cat]) => (
            <div key={key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-2xl font-bold" style={{ color: cat.score >= 80 ? '#10b981' : cat.score >= 60 ? '#fbbf24' : '#ef4444' }}>
                {cat.score}
              </p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.details}</p>
            </div>
          ))}
        </div>

        {/* Data Source Status */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(dataSources).map(([source, available]) => (
            <span
              key={source}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                available
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
              }`}
            >
              {available ? '✓' : '✗'} {source.toUpperCase()}
            </span>
          ))}
        </div>
        
        <div className="space-y-4">
          {/* SEC Company Overview */}
          <CollapsibleSection
            title="Company Overview"
            icon="🏛️"
            badge={sec ? `CIK ${sec.cik}` : undefined}
            unavailable={!sec}
          >
            {sec && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Ticker" value={sec.tickers?.join(', ') || 'N/A'} />
                  <StatCard label="Exchange" value={sec.exchanges?.join(', ') || 'N/A'} />
                  <StatCard label="Fiscal Year End" value={sec.fiscalYearEnd || 'N/A'} />
                  <StatCard label="State" value={sec.stateOfIncorporation || 'N/A'} />
                </div>
                
                <h3 className="text-white font-semibold text-sm mb-3 mt-6">Recent Filings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase">
                        <th className="text-left pb-2">Form</th>
                        <th className="text-left pb-2">Date</th>
                        <th className="text-left pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {sec.recentFilings.slice(0, 10).map((f, i) => (
                        <tr key={i} className="border-t border-white/[0.04]">
                          <td className="py-2 font-mono text-teal-400 text-xs">{f.form}</td>
                          <td className="py-2 text-xs">{f.filingDate}</td>
                          <td className="py-2 text-xs text-gray-500">{f.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Financial Snapshot */}
          <CollapsibleSection
            title="Financial Snapshot"
            icon="📊"
            badge={financials?.revenue?.length ? `${financials.revenue.length} years` : undefined}
            unavailable={!financials || (!financials.revenue?.length && !financials.totalAssets?.length)}
          >
            {financials && (
              <div>
                {financials.revenue?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Revenue</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {financials.revenue.map((r) => (
                        <StatCard key={r.year} label={String(r.year)} value={formatCurrency(r.value)} />
                      ))}
                    </div>
                  </div>
                )}
                {financials.netIncome?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Net Income</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {financials.netIncome.map((r) => (
                        <StatCard
                          key={r.year}
                          label={String(r.year)}
                          value={formatCurrency(r.value)}
                          sub={r.value < 0 ? 'Loss' : 'Profit'}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {financials.totalAssets?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Total Assets</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {financials.totalAssets.map((r) => (
                        <StatCard key={r.year} label={String(r.year)} value={formatCurrency(r.value)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
          
          {/* CFPB Consumer Complaints */}
          <CollapsibleSection
            title="Consumer Complaints"
            icon="📋"
            badge={cfpb ? `${cfpb.totalComplaints.toLocaleString()} complaints` : undefined}
            badgeColor={cfpb && cfpb.totalComplaints > 1000 ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'}
            unavailable={!cfpb}
          >
            {cfpb && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Total Complaints" value={cfpb.totalComplaints.toLocaleString()} />
                  <StatCard label="Timely Response" value={`${cfpb.timelyResponseRate}%`} />
                  <StatCard label="Disputed Rate" value={`${cfpb.disputedRate}%`} />
                  <StatCard
                    label="Top Product"
                    value={cfpb.products[0]?.name || 'N/A'}
                    sub={cfpb.products[0] ? `${cfpb.products[0].count} complaints` : undefined}
                  />
                </div>
                
                {cfpb.products.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Complaints by Product</h3>
                    <div className="space-y-2">
                      {cfpb.products.slice(0, 5).map((p) => {
                        const pct = cfpb.totalComplaints > 0 ? (p.count / cfpb.totalComplaints) * 100 : 0;
                        return (
                          <div key={p.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-300">{p.name}</span>
                              <span className="text-gray-500">{p.count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500/60 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cfpb.issues.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Top Issues</h3>
                    <div className="flex flex-wrap gap-2">
                      {cfpb.issues.slice(0, 8).map((issue) => (
                        <span key={issue.name} className="text-xs bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg text-gray-300">
                          {issue.name} <span className="text-gray-500">({issue.count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
          
          {/* EPA Environmental Compliance */}
          <CollapsibleSection
            title="Environmental Compliance"
            icon="🌿"
            badge={epa ? `${epa.totalFacilities} facilities` : undefined}
            badgeColor={epa && epa.totalViolations > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'}
            unavailable={!epa || epa.totalFacilities === 0}
          >
            {epa && epa.totalFacilities > 0 && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Total Facilities" value={String(epa.totalFacilities)} />
                  <StatCard label="Violations" value={String(epa.totalViolations)} />
                  <StatCard label="Total Penalties" value={formatCurrency(epa.totalPenalties)} />
                  <StatCard label="Compliance Rate" value={`${epa.complianceRate}%`} />
                </div>
                
                {epa.facilities.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-3">Facilities</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 text-xs uppercase">
                            <th className="text-left pb-2">Facility</th>
                            <th className="text-left pb-2">Location</th>
                            <th className="text-left pb-2">Programs</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          {epa.facilities.slice(0, 10).map((f, i) => (
                            <tr key={i} className="border-t border-white/[0.04]">
                              <td className="py-2 text-xs">{f.name}</td>
                              <td className="py-2 text-xs text-gray-500">{f.city}, {f.state}</td>
                              <td className="py-2">
                                <div className="flex flex-wrap gap-1">
                                  {f.programs.map(p => (
                                    <span key={p} className="text-[10px] bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded">{p}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
          
          {/* OSHA Workplace Safety */}
          <CollapsibleSection
            title="Workplace Safety"
            icon="⚠️"
            badge={osha ? `${osha.totalInspections} inspections` : undefined}
            badgeColor={osha && osha.willfulViolationCount > 0 ? 'bg-red-500/20 text-red-400' : osha && osha.seriousViolationCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'}
            unavailable={!osha || osha.totalInspections === 0}
          >
            {osha && osha.totalInspections > 0 && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Inspections" value={String(osha.totalInspections)} />
                  <StatCard label="Total Violations" value={String(osha.totalViolations)} />
                  <StatCard label="Serious" value={String(osha.seriousViolationCount)} />
                  <StatCard label="Total Penalties" value={formatCurrency(osha.totalPenalties)} />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase">
                        <th className="text-left pb-2">Establishment</th>
                        <th className="text-left pb-2">Location</th>
                        <th className="text-left pb-2">Date</th>
                        <th className="text-right pb-2">Penalty</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {osha.inspections.slice(0, 10).map((insp, i) => (
                        <tr key={i} className="border-t border-white/[0.04]">
                          <td className="py-2 text-xs">{insp.establishmentName}</td>
                          <td className="py-2 text-xs text-gray-500">{insp.city}, {insp.state}</td>
                          <td className="py-2 text-xs">{insp.openDate ? new Date(insp.openDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-2 text-xs text-right font-mono">{formatCurrency(insp.totalPenalty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CollapsibleSection>
          
          {/* USPTO Intellectual Property */}
          <CollapsibleSection
            title="Intellectual Property"
            icon="💡"
            badge={uspto ? `${uspto.totalPatents.toLocaleString()} patents` : undefined}
            unavailable={!uspto || (uspto.totalPatents === 0 && uspto.totalTrademarks === 0)}
          >
            {uspto && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatCard label="Patents" value={uspto.totalPatents.toLocaleString()} />
                  <StatCard label="Trademarks" value={uspto.totalTrademarks.toLocaleString()} />
                </div>
                
                {uspto.patents.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-sm mb-3">Recent Patents</h3>
                    <div className="space-y-3">
                      {uspto.patents.slice(0, 5).map((p) => (
                        <div key={p.patentNumber} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-gray-200 text-sm font-medium">{p.title}</p>
                            <span className="text-teal-400 font-mono text-xs shrink-0">{p.patentNumber}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">Granted: {p.grantDate}</p>
                          {p.abstract && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{p.abstract}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
          
          {/* FDIC Banking Data */}
          {fdic?.found && (
            <CollapsibleSection
              title="Banking & Financial Health"
              icon="🏦"
              badge={`${fdic.institutions.length} institution(s)`}
              defaultOpen={true}
            >
              <div>
                {fdic.institutions.map((inst, i) => (
                  <div key={i} className={`${i > 0 ? 'mt-4 pt-4 border-t border-white/[0.06]' : ''}`}>
                    <h3 className="text-white font-semibold text-sm mb-3">{inst.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard label="Total Assets" value={formatCurrency(inst.totalAssets)} />
                      <StatCard label="Total Deposits" value={formatCurrency(inst.totalDeposits)} />
                      <StatCard label="Net Income" value={formatCurrency(inst.netIncome)} />
                      <StatCard label="Established" value={inst.established || 'N/A'} />
                      <StatCard label="Status" value={inst.activeFlag ? 'Active' : 'Inactive'} />
                      <StatCard label="Regulator" value={inst.regulatorName || 'N/A'} />
                      {inst.returnOnAssets !== 0 && <StatCard label="ROA" value={`${inst.returnOnAssets}%`} />}
                      {inst.equityCapitalRatio !== 0 && <StatCard label="Equity/Capital" value={`${inst.equityCapitalRatio}%`} />}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-xs">
          <p>Report generated at {new Date(report.generatedAt).toLocaleString()}</p>
          <p className="mt-1">
            Data sourced from SEC EDGAR, CFPB, EPA ECHO, OSHA, USPTO, and FDIC.
            All data is publicly available government information.
          </p>
        </div>
      </main>
    </div>
  );
}
