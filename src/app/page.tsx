import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

const popularCompanies = [
  { name: 'Apple Inc.', slug: 'apple-inc', ticker: 'AAPL', cik: '0000320193' },
  { name: 'Tesla Inc.', slug: 'tesla-inc', ticker: 'TSLA', cik: '0001318605' },
  { name: 'JPMorgan Chase & Co.', slug: 'jpmorgan-chase-co', ticker: 'JPM', cik: '0000019617' },
  { name: 'Amazon.com Inc.', slug: 'amazon-com-inc', ticker: 'AMZN', cik: '0001018724' },
  { name: 'Bank of America Corp.', slug: 'bank-of-america-corp', ticker: 'BAC', cik: '0000070858' },
  { name: 'Microsoft Corp.', slug: 'microsoft-corp', ticker: 'MSFT', cik: '0000789019' },
  { name: 'Alphabet Inc.', slug: 'alphabet-inc', ticker: 'GOOGL', cik: '0001652044' },
  { name: 'Meta Platforms Inc.', slug: 'meta-platforms-inc', ticker: 'META', cik: '0001326801' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-teal-400 text-2xl">🏢</span>
            <span className="text-white font-bold text-xl">CompanyIntel</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Free & Open Source</span>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <main className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            <span className="text-teal-400 text-sm font-medium">Powered by public government data</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Know who you&apos;re doing
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              business with.
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Comprehensive company intelligence from SEC, CFPB, EPA, OSHA, USPTO, and FDIC — 
            all in one place. Free. No sign-up required.
          </p>
          
          <SearchBar large />
          
          <p className="text-gray-600 text-sm mt-4">
            Search by company name or ticker symbol
          </p>
        </div>
        
        {/* Popular Companies */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4 text-center">Popular Companies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularCompanies.map((company) => (
              <Link
                key={company.cik}
                href={`/report/${company.slug}?cik=${company.cik}&name=${encodeURIComponent(company.name)}`}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-teal-500/20 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-teal-400 font-mono font-semibold text-sm">{company.ticker}</span>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm font-medium">{company.name}</p>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Features */}
        <div className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <h2 className="text-2xl font-bold text-white text-center mb-12">Six Data Sources. One Report.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🏛️', title: 'SEC EDGAR', desc: 'Company filings, financial data, officers, and regulatory submissions.' },
                { icon: '📋', title: 'CFPB Complaints', desc: 'Consumer complaint history, response rates, and trending issues.' },
                { icon: '🌿', title: 'EPA ECHO', desc: 'Environmental violations, inspections, and compliance status.' },
                { icon: '⚠️', title: 'OSHA Safety', desc: 'Workplace safety inspections, violations, and penalty history.' },
                { icon: '💡', title: 'USPTO Patents', desc: 'Patent portfolio and trademark registrations.' },
                { icon: '🏦', title: 'FDIC BankFind', desc: 'Banking health data for financial institutions.' },
              ].map((feature) => (
                <div key={feature.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                  <span className="text-3xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>CompanyIntel aggregates publicly available government data. Not financial advice.</p>
          <p className="mt-2">Built with Next.js • Data from SEC, CFPB, EPA, OSHA, USPTO, FDIC</p>
        </div>
      </footer>
    </div>
  );
}
