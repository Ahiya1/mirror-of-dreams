// components/dreams/CreateDreamModal.tsx - Glass redesigned modal for creating new dreams

'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassModal, GlowButton, GlassCard } from '@/components/ui/glass';
import { AlertTriangle } from 'lucide-react';

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

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Your Dream 🌟"
      glassIntensity="strong"
      className="max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <GlassCard className="border-l-4 border-mirror-error/60">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-mirror-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-white/90">
            Dream Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Launch Sustainable Fashion Brand"
            maxLength={200}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow"
          />
          <div className="text-xs text-white/40 text-right">
            {title.length} / 200
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-white/90">
            Describe Your Dream
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Create an ethical, sustainable clothing line that proves fashion can be both beautiful and environmentally responsible..."
            maxLength={2000}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-vertical"
          />
          <div className="text-xs text-white/40 text-right">
            {description.length} / 2000
          </div>
        </div>

        {/* Target Date Field */}
        <div className="space-y-2">
          <label htmlFor="targetDate" className="block text-sm font-medium text-white/90">
            Target Date (Optional)
          </label>
          <input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow [color-scheme:dark]"
          />
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-white/90">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-mirror-midnight">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
          <GlowButton
            variant="ghost"
            size="md"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </GlowButton>
          <GlowButton
            variant="primary"
            size="md"
            disabled={createDream.isPending}
            className="px-6"
          >
            {createDream.isPending ? 'Creating...' : 'Create Dream'}
          </GlowButton>
        </div>
      </form>
    </GlassModal>
  );
}
