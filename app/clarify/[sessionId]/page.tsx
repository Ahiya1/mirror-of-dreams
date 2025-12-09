// app/clarify/[sessionId]/page.tsx - Clarify conversation page
// Builder: Phase 1 Part C (Iteration 24), Updated: Iteration 26 (Plan 17) by Builder-3
// Purpose: Chat interface with message list and input field
// Added: Streaming UI, dream creation toast notifications

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { CosmicLoader, GlowButton, GlassCard } from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClarifySessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [inputValue, setInputValue] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Streaming state
  const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const [toolUseResult, setToolUseResult] = useState<{
    dreamId: string;
    dreamTitle: string;
  } | null>(null);

  // Auth redirects
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && user.tier === 'free' && !user.isCreator && !user.isAdmin) {
        router.push('/pricing?feature=clarify');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch session with messages
  const { data, isLoading, refetch } = trpc.clarify.getSession.useQuery(
    { sessionId },
    {
      enabled: !!sessionId && isAuthenticated && (user?.tier !== 'free' || user?.isCreator || user?.isAdmin),
    }
  );

  // Send message mutation
  const sendMessage = trpc.clarify.sendMessage.useMutation({
    onSuccess: async () => {
      // Wait for refetch to complete before clearing pending message
      await refetch();
      setPendingMessage(null);
    },
    onError: () => {
      // On error, restore the message to input
      if (pendingMessage) {
        setInputValue(pendingMessage);
      }
      setPendingMessage(null);
    },
  });

  // Scroll to bottom when messages change, pending message appears, or streaming content updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.messages, pendingMessage, streamingContent]);

  // Focus input on load
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 128) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || streamState === 'streaming') return;

    // Use streaming handler
    handleSendStreaming();
  };

  // Fallback non-streaming handler (kept for potential fallback scenarios)
  const handleSendNonStreaming = () => {
    const content = inputValue.trim();
    if (!content || sendMessage.isPending) return;

    // Optimistic update: show message immediately
    setPendingMessage(content);
    setInputValue('');

    sendMessage.mutate({
      sessionId,
      content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle stream events from SSE
  const handleStreamEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
    switch (eventType) {
      case 'token':
        setStreamingContent(prev => prev + (data.text as string));
        break;
      case 'tool_use_result':
        if (data.success && data.dreamId) {
          setToolUseResult({
            dreamId: data.dreamId as string,
            dreamTitle: data.dreamTitle as string,
          });
          toast.success(`Dream created: "${data.dreamTitle}"`, {
            duration: 8000,
            action: {
              label: 'View Dream',
              onClick: () => router.push(`/dreams/${data.dreamId}`),
            },
          });
        }
        break;
      case 'done':
        setStreamState('idle');
        setPendingMessage(null);
        setStreamingContent('');
        refetch(); // Refresh messages from server
        break;
      case 'error':
        setStreamState('error');
        toast.error('Something went wrong. Please try again.');
        // Restore input for retry
        if (pendingMessage) {
          setInputValue(pendingMessage);
        }
        setPendingMessage(null);
        setStreamingContent('');
        break;
    }
  }, [toast, router, refetch, pendingMessage]);

  // Streaming message handler
  const handleSendStreaming = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || streamState === 'streaming') return;

    // Optimistic update
    setPendingMessage(content);
    setInputValue('');
    setStreamingContent('');
    setToolUseResult(null);
    setStreamState('streaming');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clarify/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.slice(6));
                handleStreamEvent(eventType, data);
              } catch {
                // Skip malformed JSON
              }
              i++; // Skip data line
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setStreamState('error');
      toast.error('Failed to send message. Please try again.');
      // Fallback: restore input for retry
      if (pendingMessage) {
        setInputValue(pendingMessage);
      }
      setPendingMessage(null);
      setStreamingContent('');
    }
  }, [inputValue, streamState, sessionId, handleStreamEvent, toast, pendingMessage]);

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Guard
  if (!isAuthenticated || (user && user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <GlassCard className="text-center p-8">
          <p className="text-white/70 mb-4">Session not found</p>
          <GlowButton onClick={() => router.push('/clarify')}>
            Back to Clarify
          </GlowButton>
        </GlassCard>
      </div>
    );
  }

  const { session, messages } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark flex flex-col">
      <AppNavigation currentPage="clarify" />

      {/* Session Header */}
      <div className="pt-nav">
        <GlassCard className="mx-4 sm:mx-8 mt-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clarify')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Back to sessions"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-medium text-white truncate">
                {session.title}
              </h1>
              <p className="text-sm text-white/50">
                {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 text-lg mb-2">
                Start your conversation
              </p>
              <p className="text-white/30 text-sm">
                Share what's on your mind - there's no right or wrong here.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[75%]',
                    message.role === 'user'
                      ? 'bg-purple-600/30 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-3'
                      : 'bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <AIResponseRenderer content={message.content} />
                    </div>
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs text-white/30 mt-2">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Pending user message (optimistic update) */}
          {pendingMessage && (
            <div className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[75%] bg-purple-600/30 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-3">
                <p className="text-white whitespace-pre-wrap">{pendingMessage}</p>
                <p className="text-xs text-white/30 mt-2">Just now</p>
              </div>
            </div>
          )}

          {/* Streaming assistant message */}
          {streamState === 'streaming' && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-white whitespace-pre-wrap">{streamingContent}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/30">Streaming...</span>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator - "Mirror is reflecting..." for streaming */}
          {streamState === 'streaming' && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Mirror is reflecting...</span>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator - fallback for non-streaming */}
          {sendMessage.isPending && streamState !== 'streaming' && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Mobile optimized with safe-area padding */}
      <div className="px-4 sm:px-8 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6">
        <div className="max-w-3xl mx-auto">
          <GlassCard className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 resize-none max-h-32 text-base"
              style={{
                minHeight: '24px',
                fontSize: '16px', // Prevents iOS zoom on focus
              }}
              disabled={streamState === 'streaming' || sendMessage.isPending}
            />
            <GlowButton
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || streamState === 'streaming' || sendMessage.isPending}
              className="shrink-0 min-w-[44px] min-h-[44px]"
            >
              {streamState === 'streaming' || sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </GlowButton>
          </GlassCard>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
