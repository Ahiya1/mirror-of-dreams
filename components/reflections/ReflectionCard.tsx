'use client';

import Link from 'next/link';
import { type Reflection } from '@/types/reflection';

interface ReflectionCardProps {
  reflection: Reflection;
}

export function ReflectionCard({ reflection }: ReflectionCardProps) {
  const formattedDate = new Date(reflection.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get tone badge styling
  const getToneBadge = (tone: string) => {
    const styles = {
      gentle: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      intense: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      fusion: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    };
    return styles[tone as keyof typeof styles] || styles.fusion;
  };

  // Snippet from AI response (120 characters - Pattern from plan)
  const snippet = reflection.aiResponse
    .replace(/^#{1,3}\s+.*$/gm, '') // Remove markdown headings
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\*/g, '') // Remove markdown italic
    .replace(/\n\n/g, ' ') // Replace double newlines with space
    .trim()
    .substring(0, 120) + '...';

  // Relative time helper
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <Link href={`/reflections/${reflection.id}`}>
      <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 cursor-pointer">
        {/* Premium indicator */}
        {reflection.isPremium && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-300">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium
            </span>
          </div>
        )}

        {/* Dream badge (title as dream identifier) */}
        {reflection.title && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs text-purple-300 font-medium">
              {reflection.title}
            </span>
          </div>
        )}

        {/* Date and tone */}
        <div className="flex items-center gap-3 mb-4 text-xs text-white/40">
          <span>{getRelativeTime(reflection.createdAt)}</span>
          <span>•</span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium capitalize ${getToneBadge(reflection.tone)}`}>
            {reflection.tone}
          </span>
        </div>

        {/* AI Response Snippet (120 chars) */}
        <p className="text-sm text-white/80 line-clamp-3 mb-4 leading-relaxed">
          {snippet}
        </p>

        {/* Metadata footer */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {/* Word count */}
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{reflection.wordCount.toLocaleString()} words</span>
          </div>

          {/* Read time */}
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{reflection.estimatedReadTime} min read</span>
          </div>

          {/* Rating */}
          {reflection.rating && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-yellow-400">{reflection.rating}/10</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {reflection.tags && reflection.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {reflection.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-300 ring-1 ring-inset ring-purple-500/20"
              >
                {tag}
              </span>
            ))}
            {reflection.tags.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-500/20">
                +{reflection.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* "Read full reflection" indicator (appears on hover) */}
        <div className="mt-4 flex items-center gap-2 text-sm text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Read full reflection</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Hover glow bottom border */}
        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
      </div>
    </Link>
  );
}
