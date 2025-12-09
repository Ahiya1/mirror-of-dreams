'use client';

import { useState } from 'react';
import { GlowButton } from '@/components/ui/glass/GlowButton';

interface FeedbackFormProps {
  reflectionId: string;
  currentRating?: number | null;
  currentFeedback?: string | null;
  onSubmit: (rating: number, feedback?: string) => void;
  isSubmitting: boolean;
}

export function FeedbackForm({
  reflectionId,
  currentRating,
  currentFeedback,
  onSubmit,
  isSubmitting,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(currentRating || 5);
  const [feedback, setFeedback] = useState<string>(currentFeedback || '');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, feedback || undefined);
  };

  const displayRating = hoveredRating ?? rating;

  // Warm response messages based on rating
  const getRatingMessage = (value: number) => {
    if (value <= 3) return "Thank you for your honesty";
    if (value <= 5) return "Your feedback helps me grow";
    if (value <= 7) return "I'm glad this resonated";
    if (value <= 9) return "That means a lot";
    return "I'm honored to walk with you";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heart-based rating */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-4">
          How did this reflection land for you?
        </label>

        {/* Heart rating display */}
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400/50 rounded"
              aria-label={`Rate ${star} out of 10`}
            >
              <svg
                className={`h-7 w-7 transition-colors ${
                  star <= displayRating
                    ? 'text-amber-400 fill-current'
                    : 'text-white/20'
                }`}
                fill={star <= displayRating ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>
          ))}
          <span className="ml-3 text-xl font-medium text-amber-400">{displayRating}/10</span>
        </div>

        {/* Warm message based on rating */}
        <p className="text-sm text-white/50 italic">{getRatingMessage(displayRating)}</p>
      </div>

      {/* Feedback text */}
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-white/80 mb-3">
          Anything you'd like to share? (optional)
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="What resonated? What would you like more of?"
          className="block w-full rounded-xl border border-purple-500/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm transition-all focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
          maxLength={500}
        />
        <div className="flex justify-end mt-2">
          <span className="text-xs text-white/40">
            {feedback.length}/500
          </span>
        </div>
      </div>

      {/* Submit button */}
      <GlowButton
        type="submit"
        variant="warm"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sharing...
          </span>
        ) : (
          currentRating ? 'Update' : 'Share Feedback'
        )}
      </GlowButton>
    </form>
  );
}
