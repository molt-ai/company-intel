import { Suspense } from 'react';
import { Metadata } from 'next';
import ReportClient from '@/components/ReportClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; cik?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const companyName = resolvedSearch.name || resolvedParams.slug.replace(/-/g, ' ');
  
  return {
    title: `${companyName} — Company Intelligence Report | CompanyIntel`,
    description: `Comprehensive due diligence report for ${companyName}. SEC filings, consumer complaints, environmental compliance, workplace safety, and more.`,
    openGraph: {
      title: `${companyName} — Company Intelligence Report`,
      description: `SEC, CFPB, EPA, OSHA, and USPTO data for ${companyName}`,
      type: 'article',
    },
  };
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-6"></div>
          <p className="text-gray-400 text-lg">Loading report...</p>
        </div>
      </div>
    }>
      <ReportClient />
    </Suspense>
  );
}
