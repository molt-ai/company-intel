'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  cik: string;
  name: string;
  ticker: string;
}

export default function SearchBar({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/company-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  function navigateToReport(result: SearchResult) {
    const slug = result.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    router.push(`/report/${slug}?cik=${result.cik}&name=${encodeURIComponent(result.name)}`);
    setShowDropdown(false);
    setQuery('');
  }
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) {
      navigateToReport(results[0]);
    } else if (query.length >= 2) {
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      router.push(`/report/${slug}?name=${encodeURIComponent(query)}`);
      setShowDropdown(false);
      setQuery('');
    }
  }
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center ${large ? 'max-w-2xl mx-auto' : 'max-w-md'}`}>
          <div className="absolute left-4 text-gray-400">
            <svg className={`${large ? 'w-6 h-6' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search any US company..."
            className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all ${
              large ? 'pl-14 pr-6 py-5 text-lg' : 'pl-11 pr-4 py-3 text-sm'
            }`}
          />
          {isLoading && (
            <div className="absolute right-4">
              <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </form>
      
      {showDropdown && results.length > 0 && (
        <div className={`absolute z-50 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden ${large ? 'max-w-2xl mx-auto left-0 right-0' : 'w-full'}`}>
          {results.map((result, i) => (
            <button
              key={result.cik}
              onClick={() => navigateToReport(result)}
              className={`w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.06] transition-colors ${
                i !== results.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <div>
                <p className="text-white font-medium text-sm">{result.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">CIK: {result.cik}</p>
              </div>
              {result.ticker && (
                <span className="text-teal-400 font-mono text-sm font-semibold bg-teal-500/10 px-2.5 py-1 rounded-lg">
                  {result.ticker}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
