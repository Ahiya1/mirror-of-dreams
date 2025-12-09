// app/api/cron/consolidate-patterns/route.ts
// Vercel cron job for nightly pattern consolidation

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase';
import { consolidateUserPatterns } from '@/lib/clarify/consolidation';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

/**
 * GET /api/cron/consolidate-patterns
 *
 * Vercel cron job that runs nightly to extract patterns from
 * Clarify conversations. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Consolidation] Starting pattern consolidation job');

  try {
    // Find users with unconsolidated messages
    const { data: usersWithMessages, error: queryError } = await supabase
      .from('clarify_messages')
      .select(`
        session:clarify_sessions!inner(user_id)
      `)
      .eq('consolidated', false)
      .limit(100);

    if (queryError) {
      throw new Error(`Failed to query users: ${queryError.message}`);
    }

    // Extract unique user IDs
    const userIds = [...new Set(
      (usersWithMessages || [])
        .map((m: any) => m.session?.user_id)
        .filter(Boolean)
    )];

    console.log(`[Consolidation] Found ${userIds.length} users with unconsolidated messages`);

    // Process each user
    const results = [];
    for (const userId of userIds) {
      const result = await consolidateUserPatterns(userId as string);
      results.push(result);

      // Log progress
      if (result.success) {
        console.log(`[Consolidation] User ${userId}: ${result.patternsExtracted} patterns from ${result.messagesProcessed} messages`);
      } else {
        console.error(`[Consolidation] User ${userId}: FAILED - ${result.error}`);
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalPatterns = results.reduce((sum, r) => sum + r.patternsExtracted, 0);
    const totalMessages = results.reduce((sum, r) => sum + r.messagesProcessed, 0);

    console.log(`[Consolidation] Complete in ${duration}ms: ${successCount}/${userIds.length} users, ${totalPatterns} patterns, ${totalMessages} messages`);

    return NextResponse.json({
      success: true,
      duration,
      usersProcessed: userIds.length,
      successCount,
      totalPatterns,
      totalMessages,
      results: results.map(r => ({
        userId: r.userId.slice(0, 8) + '...', // Truncate for privacy
        success: r.success,
        patterns: r.patternsExtracted,
        messages: r.messagesProcessed,
      })),
    });
  } catch (error) {
    console.error('[Consolidation] Job failed:', error);
    return NextResponse.json(
      {
        error: 'Consolidation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
