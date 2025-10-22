// app/dreams/[id]/page.tsx - Dream detail page

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export default function DreamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch dream
  const { data: dream, isLoading, refetch } = trpc.dreams.get.useQuery({ id: params.id });

  // Fetch reflections for this dream
  const { data: reflections } = trpc.reflections.list.useQuery({
    page: 1,
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Filter reflections by dream_id (we'll need to add this filter to the backend)
  const dreamReflections = reflections?.items?.filter(
    (r: any) => r.dream_id === params.id
  ) || [];

  const deleteDream = trpc.dreams.delete.useMutation();
  const updateStatus = trpc.dreams.updateStatus.useMutation();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dream? This cannot be undone.')) {
      return;
    }

    try {
      await deleteDream.mutateAsync({ id: params.id });
      router.push('/dreams');
    } catch (error: any) {
      alert(`Failed to delete dream: ${error.message}`);
    }
  };

  const handleStatusChange = async (status: 'active' | 'achieved' | 'archived' | 'released') => {
    try {
      await updateStatus.mutateAsync({ id: params.id, status });
      refetch();
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="dream-detail">
        <div className="loading">
          <div className="spinner">✨</div>
          <p>Loading dream...</p>
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="dream-detail">
        <div className="error">Dream not found</div>
      </div>
    );
  }

  const statusEmojiMap: Record<string, string> = {
    active: '✨',
    achieved: '🎉',
    archived: '📦',
    released: '🕊️',
  };
  const statusEmoji = statusEmojiMap[dream.status as string] || '✨';

  const categoryEmojiMap: Record<string, string> = {
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
  };
  const categoryEmoji = categoryEmojiMap[dream.category as string] || '⭐';

  return (
    <div className="dream-detail">
      <div className="dream-detail__container">
        {/* Back Button */}
        <button onClick={() => router.push('/dreams')} className="back-btn">
          ← Back to Dreams
        </button>

        {/* Header */}
        <div className="dream-detail__header">
          <div className="header-left">
            <div className="emoji">{categoryEmoji}</div>
            <div>
              <h1 className="title">{dream.title}</h1>
              <div className="meta">
                <span className={`status status--${dream.status}`}>
                  {statusEmoji} {dream.status}
                </span>
                {dream.daysLeft !== null && dream.daysLeft !== undefined && (
                  <span className="days-left">
                    {dream.daysLeft < 0
                      ? `${Math.abs(dream.daysLeft)} days overdue`
                      : dream.daysLeft === 0
                      ? 'Today!'
                      : `${dream.daysLeft} days left`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button onClick={() => router.push(`/reflection?dreamId=${params.id}`)} className="btn-primary">
              ✨ Reflect
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Delete
            </button>
          </div>
        </div>

        {/* Description */}
        {dream.description && (
          <div className="dream-detail__description">
            <h2 className="section-title">Description</h2>
            <p className="description-text">{dream.description}</p>
          </div>
        )}

        {/* Status Actions */}
        <div className="dream-detail__status-actions">
          <h2 className="section-title">Update Status</h2>
          <div className="status-buttons">
            <button
              onClick={() => handleStatusChange('active')}
              disabled={dream.status === 'active'}
              className="status-btn"
            >
              ✨ Active
            </button>
            <button
              onClick={() => handleStatusChange('achieved')}
              disabled={dream.status === 'achieved'}
              className="status-btn"
            >
              🎉 Achieved
            </button>
            <button
              onClick={() => handleStatusChange('archived')}
              disabled={dream.status === 'archived'}
              className="status-btn"
            >
              📦 Archive
            </button>
            <button
              onClick={() => handleStatusChange('released')}
              disabled={dream.status === 'released'}
              className="status-btn"
            >
              🕊️ Release
            </button>
          </div>
        </div>

        {/* Reflections */}
        <div className="dream-detail__reflections">
          <h2 className="section-title">
            Reflections ({dream.reflectionCount || 0})
          </h2>
          {dreamReflections.length > 0 ? (
            <div className="reflections-list">
              {dreamReflections.map((reflection: any) => (
                <div
                  key={reflection.id}
                  onClick={() => router.push(`/reflections/${reflection.id}`)}
                  className="reflection-item"
                >
                  <div className="reflection-date">
                    {new Date(reflection.created_at).toLocaleDateString()}
                  </div>
                  <div className="reflection-preview">
                    {reflection.dream?.substring(0, 150)}...
                  </div>
                  <div className="reflection-meta">
                    <span className="tone">{reflection.tone}</span>
                    <span className="words">{reflection.word_count} words</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reflections">
              <p>No reflections yet. Create your first reflection for this dream!</p>
              <button
                onClick={() => router.push(`/reflection?dreamId=${params.id}`)}
                className="btn-primary"
              >
                Create First Reflection
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dream-detail {
          min-height: 100vh;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          padding: 2rem;
        }

        .dream-detail__container {
          max-width: 900px;
          margin: 0 auto;
        }

        .back-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .dream-detail__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .header-left {
          display: flex;
          gap: 1.5rem;
          flex: 1;
        }

        .emoji {
          font-size: 3rem;
        }

        .title {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .status {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status--active {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }

        .status--achieved {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .status--archived {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .status--released {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .days-left {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary,
        .btn-danger {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .dream-detail__description,
        .dream-detail__status-actions,
        .dream-detail__reflections {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin: 0 0 1rem 0;
        }

        .description-text {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.7;
          font-size: 1.05rem;
        }

        .status-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .status-btn {
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s;
        }

        .status-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .status-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reflections-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reflection-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reflection-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .reflection-date {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .reflection-preview {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .reflection-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .tone {
          color: #a78bfa;
          text-transform: capitalize;
        }

        .words {
          color: rgba(255, 255, 255, 0.6);
        }

        .no-reflections {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .no-reflections p {
          margin-bottom: 1.5rem;
        }

        .loading,
        .error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          color: white;
        }

        .spinner {
          font-size: 3rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .dream-detail {
            padding: 1rem;
          }

          .dream-detail__header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
            justify-content: stretch;
          }

          .btn-primary,
          .btn-danger {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
