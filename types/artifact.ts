// types/artifact.ts - Artifact types

export type ArtifactType = 'visual' | 'soundscape' | 'poetic';

/**
 * Artifact object
 */
export interface Artifact {
  id: string;
  userId: string;
  reflectionId: string;
  artifactType: ArtifactType;
  title: string;
  description: string;
  imageUrl: string | null;
  audioUrl: string | null;
  textContent: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Database row type (matches Supabase schema if exists)
 */
export interface ArtifactRow {
  id: string;
  user_id: string;
  reflection_id: string;
  artifact_type: string;
  title: string;
  description: string;
  image_url: string | null;
  audio_url: string | null;
  text_content: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Transform database row to Artifact type
 */
export function artifactRowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    userId: row.user_id,
    reflectionId: row.reflection_id,
    artifactType: row.artifact_type as ArtifactType,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    textContent: row.text_content,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

/**
 * Artifact creation input
 */
export interface ArtifactCreateInput {
  reflectionId: string;
  artifactType: ArtifactType;
  title?: string;
  description?: string;
}
