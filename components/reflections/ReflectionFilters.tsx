'use client';

import { useState } from 'react';
import { type ReflectionTone } from '@/types/reflection';

interface ReflectionFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  tone?: ReflectionTone;
  onToneChange: (tone?: ReflectionTone) => void;
  isPremium?: boolean;
  onIsPremiumChange: (isPremium?: boolean) => void;
  sortBy: 'created_at' | 'word_count' | 'rating';
  onSortByChange: (sortBy: 'created_at' | 'word_count' | 'rating') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  // Note: Dream filtering would be added here when reflections are linked to dreams table
  // dreamId?: string;
  // onDreamIdChange?: (dreamId?: string) => void;
  // dreams?: Array<{ id: string; title: string }>;
}

export function ReflectionFilters({
  search,
  onSearchChange,
  tone,
  onToneChange,
  isPremium,
  onIsPremiumChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: ReflectionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = tone !== undefined || isPremium !== undefined;

  const clearFilters = () => {
    onToneChange(undefined);
    onIsPremiumChange(undefined);
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search reflections..."
          className="block w-full rounded-lg border border-purple-500/20 bg-slate-900/50 py-3 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter toggle and sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-slate-900/70"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
            </span>
          )}
        </button>

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as any)}
          className="rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="created_at">Most Recent</option>
          <option value="word_count">Longest</option>
          <option value="rating">Highest Rated</option>
        </select>

        {/* Sort order */}
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-slate-900/70"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          )}
        </button>

        {/* Clear filters button */}
        {(hasActiveFilters || search) && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-4 backdrop-blur-sm space-y-4">
          {/* Tone filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onToneChange(undefined)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tone === undefined
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                All Tones
              </button>
              <button
                onClick={() => onToneChange('gentle')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tone === 'gentle'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                Gentle
              </button>
              <button
                onClick={() => onToneChange('intense')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tone === 'intense'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                Intense
              </button>
              <button
                onClick={() => onToneChange('fusion')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tone === 'fusion'
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                Sacred Fusion
              </button>
            </div>
          </div>

          {/* Premium filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onIsPremiumChange(undefined)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isPremium === undefined
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => onIsPremiumChange(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isPremium === true
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                Premium Only
              </button>
              <button
                onClick={() => onIsPremiumChange(false)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isPremium === false
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800'
                }`}
              >
                Standard Only
              </button>
            </div>
          </div>

          {/* Dream filter - Commented out until reflections are linked to dreams table */}
          {/*
          {dreams && dreams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dream</label>
              <select
                value={dreamId || ''}
                onChange={(e) => onDreamIdChange?.(e.target.value || undefined)}
                className="w-full rounded-lg border border-purple-500/20 bg-slate-800/50 px-4 py-2 text-sm text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">All Dreams</option>
                {dreams.map((dream) => (
                  <option key={dream.id} value={dream.id}>
                    {dream.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          */}
        </div>
      )}
    </div>
  );
}
