// server/trpc/routers/artifact.ts - Artifact generation (visual, soundscape, poetic)

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { createArtifactSchema } from '@/types/schemas';

export const artifactRouter = router({
  // Generate artifact from reflection
  generate: protectedProcedure
    .input(createArtifactSchema)
    .mutation(async ({ ctx, input }) => {
      const { reflectionId, artifactType, title, description } = input;

      // Get reflection data
      const { data: reflection, error: reflectionError } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', reflectionId)
        .eq('user_id', ctx.user.id)
        .single();

      if (reflectionError || !reflection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reflection not found',
        });
      }

      // Check if artifact already exists
      const { data: existingArtifact } = await supabase
        .from('artifacts')
        .select('*')
        .eq('reflection_id', reflectionId)
        .eq('artifact_type', artifactType)
        .single();

      if (existingArtifact) {
        return {
          artifact: existingArtifact,
          message: 'Artifact already exists for this reflection',
          isNew: false,
        };
      }

      // For now, we'll create a placeholder artifact
      // Full implementation would use GPT-4o analysis, canvas generation, and R2 upload
      const { data: artifact, error: artifactError } = await supabase
        .from('artifacts')
        .insert({
          user_id: ctx.user.id,
          reflection_id: reflectionId,
          artifact_type: artifactType,
          title: title || `${artifactType} artifact for reflection`,
          description: description || `Generated ${artifactType} artifact`,
          artifact_url: '', // Would be populated after R2 upload
          metadata: {
            tone: reflection.tone,
            isPremium: reflection.is_premium,
            generatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (artifactError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create artifact',
        });
      }

      return {
        artifact,
        message: 'Artifact generated successfully',
        isNew: true,
      };
    }),

  // Get artifacts list
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        artifactType: z.enum(['visual', 'soundscape', 'poetic']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, artifactType } = input;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('artifacts')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id);

      if (artifactType) {
        query = query.eq('artifact_type', artifactType);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch artifacts',
        });
      }

      return {
        items: data || [],
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      };
    }),

  // Get single artifact by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }

      return data;
    }),

  // Get artifact by reflection ID
  getByReflectionId: protectedProcedure
    .input(
      z.object({
        reflectionId: z.string().uuid(),
        artifactType: z.enum(['visual', 'soundscape', 'poetic']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = supabase
        .from('artifacts')
        .select('*')
        .eq('reflection_id', input.reflectionId)
        .eq('user_id', ctx.user.id);

      if (input.artifactType) {
        query = query.eq('artifact_type', input.artifactType);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch artifacts',
        });
      }

      return data || [];
    }),

  // Delete artifact
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: artifact } = await supabase
        .from('artifacts')
        .select('id')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (!artifact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artifact not found',
        });
      }

      const { error } = await supabase
        .from('artifacts')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete artifact',
        });
      }

      return {
        message: 'Artifact deleted successfully',
      };
    }),
});

export type ArtifactRouter = typeof artifactRouter;
