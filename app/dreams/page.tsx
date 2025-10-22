// app/dreams/page.tsx - Dreams list page

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { DreamCard } from '@/components/dreams/DreamCard';
import { CreateDreamModal } from '@/components/dreams/CreateDreamModal';

export default function DreamsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'achieved' | 'archived' | 'released' | undefined>('active');

  // Fetch dreams
  const { data: dreams, isLoading, refetch } = trpc.dreams.list.useQuery({
    status: statusFilter,
    includeStats: true,
  });

  // Fetch limits
  const { data: limits } = trpc.dreams.getLimits.useQuery();

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleReflect = (dreamId: string) => {
    router.push(`/reflection?dreamId=${dreamId}`);
  };

  const handleEvolution = (dreamId: string) => {
    router.push(`/evolution?dreamId=${dreamId}`);
  };

  const handleVisualize = (dreamId: string) => {
    router.push(`/visualizations?dreamId=${dreamId}`);
  };

  if (isLoading) {
    return (
      <div className="dreams-page">
        <div className="dreams-page__loading">
          <div className="spinner">✨</div>
          <p>Loading your dreams...</p>
        </div>
        <style jsx>{`
          .dreams-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
            padding: 2rem;
          }
          .dreams-page__loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            color: white;
            gap: 1rem;
          }
          .spinner {
            font-size: 3rem;
            animation: spin 2s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dreams-page">
      <div className="dreams-page__container">
        {/* Header */}
        <div className="dreams-page__header">
          <div>
            <h1 className="dreams-page__title">Your Dreams</h1>
            <p className="dreams-page__subtitle">
              Track and reflect on your life's aspirations
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={limits && !limits.canCreate}
            className="dreams-page__create-btn"
          >
            + Create Dream
          </button>
        </div>

        {/* Limits Info */}
        {limits && (
          <div className="dreams-page__limits">
            <span className="dreams-page__limits-text">
              {limits.dreamsUsed} / {limits.dreamsLimit === 999999 ? '∞' : limits.dreamsLimit} dreams
            </span>
            {!limits.canCreate && (
              <span className="dreams-page__limits-warning">
                Upgrade to create more dreams
              </span>
            )}
          </div>
        )}

        {/* Status Filter */}
        <div className="dreams-page__filters">
          <button
            onClick={() => setStatusFilter('active')}
            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          >
            ✨ Active
          </button>
          <button
            onClick={() => setStatusFilter('achieved')}
            className={`filter-btn ${statusFilter === 'achieved' ? 'active' : ''}`}
          >
            🎉 Achieved
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`filter-btn ${statusFilter === 'archived' ? 'active' : ''}`}
          >
            📦 Archived
          </button>
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`filter-btn ${statusFilter === undefined ? 'active' : ''}`}
          >
            All
          </button>
        </div>

        {/* Dreams Grid */}
        {dreams && dreams.length > 0 ? (
          <div className="dreams-page__grid">
            {dreams.map((dream: any) => (
              <DreamCard
                key={dream.id}
                id={dream.id}
                title={dream.title}
                description={dream.description}
                targetDate={dream.target_date}
                daysLeft={dream.daysLeft}
                status={dream.status}
                category={dream.category}
                reflectionCount={dream.reflectionCount || 0}
                lastReflectionAt={dream.lastReflectionAt}
                onReflect={() => handleReflect(dream.id)}
                onEvolution={() => handleEvolution(dream.id)}
                onVisualize={() => handleVisualize(dream.id)}
              />
            ))}
          </div>
        ) : (
          <div className="dreams-page__empty">
            <div className="empty-state">
              <div className="empty-state__icon">🌟</div>
              <h2 className="empty-state__title">No dreams yet</h2>
              <p className="empty-state__description">
                Create your first dream to begin your journey of reflection and growth.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="empty-state__btn"
              >
                Create Your First Dream
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateDreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <style jsx>{`
        .dreams-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          padding: 2rem;
        }

        .dreams-page__container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dreams-page__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .dreams-page__title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin: 0;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dreams-page__subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.5rem;
          font-size: 1.1rem;
        }

        .dreams-page__create-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .dreams-page__create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        .dreams-page__create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dreams-page__limits {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
        }

        .dreams-page__limits-text {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .dreams-page__limits-warning {
          color: #fbbf24;
          font-size: 0.875rem;
        }

        .dreams-page__filters {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .filter-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
          color: white;
        }

        .dreams-page__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .dreams-page__empty {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
        }

        .empty-state {
          text-align: center;
          max-width: 500px;
        }

        .empty-state__icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }

        .empty-state__title {
          font-size: 2rem;
          color: white;
          margin-bottom: 1rem;
        }

        .empty-state__description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .empty-state__btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .empty-state__btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        @media (max-width: 768px) {
          .dreams-page {
            padding: 1rem;
          }

          .dreams-page__header {
            flex-direction: column;
          }

          .dreams-page__title {
            font-size: 2rem;
          }

          .dreams-page__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
