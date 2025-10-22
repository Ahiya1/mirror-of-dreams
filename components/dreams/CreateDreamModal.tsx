// components/dreams/CreateDreamModal.tsx - Modal for creating new dreams

'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface CreateDreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'health', label: '🏃 Health & Fitness', emoji: '🏃' },
  { value: 'career', label: '💼 Career', emoji: '💼' },
  { value: 'relationships', label: '❤️ Relationships', emoji: '❤️' },
  { value: 'financial', label: '💰 Financial', emoji: '💰' },
  { value: 'personal_growth', label: '🌱 Personal Growth', emoji: '🌱' },
  { value: 'creative', label: '🎨 Creative', emoji: '🎨' },
  { value: 'spiritual', label: '🙏 Spiritual', emoji: '🙏' },
  { value: 'entrepreneurial', label: '🚀 Entrepreneurial', emoji: '🚀' },
  { value: 'educational', label: '📚 Educational', emoji: '📚' },
  { value: 'other', label: '⭐ Other', emoji: '⭐' },
] as const;

export function CreateDreamModal({ isOpen, onClose, onSuccess }: CreateDreamModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<string>('personal_growth');
  const [error, setError] = useState('');

  const createDream = trpc.dreams.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a dream title');
      return;
    }

    try {
      await createDream.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        category: category as any,
        priority: 5,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTargetDate('');
      setCategory('personal_growth');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create dream');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Your Dream 🌟</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Dream Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Launch Sustainable Fashion Brand"
              maxLength={200}
              required
              className="form-input"
            />
            <div className="char-count">{title.length} / 200</div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Describe Your Dream</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Create an ethical, sustainable clothing line that proves fashion can be both beautiful and environmentally responsible..."
              maxLength={2000}
              rows={4}
              className="form-textarea"
            />
            <div className="char-count">{description.length} / 2000</div>
          </div>

          <div className="form-group">
            <label htmlFor="targetDate">Target Date (Optional)</label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createDream.isPending} className="btn-primary">
              {createDream.isPending ? 'Creating...' : 'Create Dream'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
          }

          .modal-close {
            font-size: 2rem;
            background: none;
            border: none;
            cursor: pointer;
            color: #64748b;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }

          .modal-close:hover {
            background: #f1f5f9;
          }

          .modal-form {
            padding: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #334155;
          }

          .form-input,
          .form-textarea,
          .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .form-input:focus,
          .form-textarea:focus,
          .form-select:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          }

          .char-count {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 0.25rem;
            text-align: right;
          }

          .error-message {
            background: #fef2f2;
            color: #dc2626;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #fecaca;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }

          .btn-primary,
          .btn-secondary {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 1rem;
          }

          .btn-primary {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-secondary:hover {
            background: #e2e8f0;
          }
        `}</style>
      </div>
    </div>
  );
}
