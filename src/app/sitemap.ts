import { MetadataRoute } from 'next';

const topCompanies = [
  { slug: 'apple-inc', cik: '0000320193', name: 'Apple Inc.' },
  { slug: 'microsoft-corp', cik: '0000789019', name: 'Microsoft Corp.' },
  { slug: 'amazon-com-inc', cik: '0001018724', name: 'Amazon.com Inc.' },
  { slug: 'alphabet-inc', cik: '0001652044', name: 'Alphabet Inc.' },
  { slug: 'meta-platforms-inc', cik: '0001326801', name: 'Meta Platforms Inc.' },
  { slug: 'tesla-inc', cik: '0001318605', name: 'Tesla Inc.' },
  { slug: 'jpmorgan-chase-co', cik: '0000019617', name: 'JPMorgan Chase & Co.' },
  { slug: 'bank-of-america-corp', cik: '0000070858', name: 'Bank of America Corp.' },
  { slug: 'nvidia-corp', cik: '0001045810', name: 'NVIDIA Corp.' },
  { slug: 'walmart-inc', cik: '0000104169', name: 'Walmart Inc.' },
  { slug: 'johnson-johnson', cik: '0000200406', name: 'Johnson & Johnson' },
  { slug: 'unitedhealth-group', cik: '0000731766', name: 'UnitedHealth Group' },
  { slug: 'visa-inc', cik: '0001403161', name: 'Visa Inc.' },
  { slug: 'procter-gamble', cik: '0000080424', name: 'Procter & Gamble' },
  { slug: 'mastercard-inc', cik: '0001141391', name: 'Mastercard Inc.' },
  { slug: 'home-depot-inc', cik: '0000354950', name: 'Home Depot Inc.' },
  { slug: 'exxon-mobil-corp', cik: '0000034088', name: 'Exxon Mobil Corp.' },
  { slug: 'chevron-corp', cik: '0000093410', name: 'Chevron Corp.' },
  { slug: 'coca-cola-co', cik: '0000021344', name: 'The Coca-Cola Co.' },
  { slug: 'pfizer-inc', cik: '0000078003', name: 'Pfizer Inc.' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://company-intel.fly.dev';
  
  const companyPages = topCompanies.map((company) => ({
    url: `${baseUrl}/report/${company.slug}?cik=${company.cik}&name=${encodeURIComponent(company.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...companyPages,
  ];
}
