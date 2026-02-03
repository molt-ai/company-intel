import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompanyIntel — US Company Due Diligence & Intelligence",
  description: "Free company due diligence platform. Search any US company for SEC filings, consumer complaints, environmental compliance, workplace safety, patents, and more.",
  keywords: "company research, due diligence, SEC EDGAR, CFPB complaints, EPA compliance, OSHA safety, company intelligence",
  openGraph: {
    title: "CompanyIntel — Know Who You're Doing Business With",
    description: "Free company intelligence platform aggregating SEC, CFPB, EPA, OSHA, and USPTO data.",
    type: "website",
    siteName: "CompanyIntel",
  },
  twitter: {
    card: "summary_large_image",
    title: "CompanyIntel — US Company Intelligence",
    description: "Free company due diligence platform aggregating government regulatory data.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
