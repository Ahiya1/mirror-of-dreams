// components/dreams/DreamCard.tsx - Single dream display card

'use client';

import React from 'react';
import Link from 'next/link';

interface DreamCardProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  status: 'active' | 'achieved' | 'archived' | 'released';
  category?: string;
  reflectionCount: number;
  lastReflectionAt?: string | null;
  onReflect?: () => void;
  onEvolution?: () => void;
  onVisualize?: () => void;
}

export function DreamCard({
  id,
  title,
  description,
  targetDate,
  daysLeft,
  status,
  category,
  reflectionCount,
  lastReflectionAt,
  onReflect,
  onEvolution,
  onVisualize,
}: DreamCardProps) {
  const statusEmoji = {
    active: '✨',
    achieved: '🎉',
    archived: '📦',
    released: '🕊️',
  }[status];

  const categoryEmoji = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    entrepreneurial: '🚀',
    educational: '📚',
    other: '⭐',
  }[category || 'other'];

  const statusColors = {
    active: 'text-purple-600 bg-purple-50',
    achieved: 'text-green-600 bg-green-50',
    archived: 'text-gray-600 bg-gray-50',
    released: 'text-blue-600 bg-blue-50',
  };

  const getDaysLeftText = () => {
    if (!daysLeft) return null;
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Today!';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  const daysLeftText = getDaysLeftText();
  const daysLeftColor =
    daysLeft === null || daysLeft === undefined
      ? ''
      : daysLeft < 0
      ? 'text-red-600'
      : daysLeft <= 7
      ? 'text-orange-600'
      : daysLeft <= 30
      ? 'text-yellow-700'
      : 'text-gray-600';

  return (
    <div className="dream-card">
      <Link href={`/dreams/${id}`} className="dream-card__link">
        <div className="dream-card__header">
          <div className="dream-card__emoji">{categoryEmoji}</div>
          <div className="dream-card__status-badge">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
              {statusEmoji} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        <h3 className="dream-card__title">{title}</h3>

        {description && <p className="dream-card__description">{description}</p>}

        <div className="dream-card__meta">
          {daysLeftText && <div className={`dream-card__days-left ${daysLeftColor}`}>{daysLeftText}</div>}
          <div className="dream-card__reflections">{reflectionCount} reflections</div>
        </div>
      </Link>

      {status === 'active' && (
        <div className="dream-card__actions">
          <button
            onClick={(e) => {
              e.preventDefault();
              onReflect?.();
            }}
            className="dream-card__btn dream-card__btn--primary"
          >
            Reflect
          </button>
          {reflectionCount >= 4 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEvolution?.();
                }}
                className="dream-card__btn dream-card__btn--secondary"
              >
                Evolution
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onVisualize?.();
                }}
                className="dream-card__btn dream-card__btn--secondary"
              >
                Visualize
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .dream-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .dream-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .dream-card__link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .dream-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .dream-card__emoji {
          font-size: 2rem;
        }

        .dream-card__title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .dream-card__description {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .dream-card__meta {
          display: flex;
          gap: 1rem;
          align-items: center;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .dream-card__days-left {
          font-weight: 500;
        }

        .dream-card__reflections {
          color: #8b5cf6;
          font-weight: 500;
        }

        .dream-card__actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid rgba(139, 92, 246, 0.1);
        }

        .dream-card__btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .dream-card__btn--primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .dream-card__btn--primary:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .dream-card__btn--secondary {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .dream-card__btn--secondary:hover {
          background: rgba(139, 92, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
