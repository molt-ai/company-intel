'use client';

import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  unavailable?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  badge,
  badgeColor = 'bg-teal-500/20 text-teal-400',
  defaultOpen = true,
  unavailable = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.1]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {badge && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
          {unavailable && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-500/20 text-gray-400">
              Data Unavailable
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-white/[0.06]">
          <div className="pt-4">
            {unavailable ? (
              <p className="text-gray-500 text-sm">This data source did not return results for this company.</p>
            ) : (
              children
            )}
          </div>
        </div>
      )}
    </div>
  );
}
