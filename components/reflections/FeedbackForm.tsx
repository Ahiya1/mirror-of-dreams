'use client';

import { useState } from 'react';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating slider with stars */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          How would you rate this reflection?
        </label>

        {/* Star rating display */}
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <svg
                className={`h-6 w-6 ${
                  star <= displayRating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-600'
                }`}
                fill={star <= displayRating ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-2xl font-bold text-yellow-400">{displayRating}/10</span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min="1"
          max="10"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(rating / 10) * 100}%, #374151 ${(rating / 10) * 100}%, #374151 100%)`,
          }}
        />

        {/* Rating labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Not helpful</span>
          <span>Very helpful</span>
        </div>
      </div>

      {/* Feedback text */}
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-300 mb-2">
          Additional feedback (optional)
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="What did you find most valuable about this reflection? Any suggestions?"
          className="block w-full rounded-lg border border-purple-500/20 bg-slate-900/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {feedback.length}/500 characters
          </span>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : (
          currentRating ? 'Update Feedback' : 'Submit Feedback'
        )}
      </button>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fbbf24;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fbbf24;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </form>
  );
}
