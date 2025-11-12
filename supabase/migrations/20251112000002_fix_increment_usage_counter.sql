-- =====================================================
-- Migration: Fix increment_usage_counter to include tier_at_time
-- Date: 2025-11-12
-- Purpose: Ensure tier_at_time is set when creating usage records
-- =====================================================

CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_month DATE,
  p_counter_name TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_tier TEXT;
BEGIN
  -- Get user's current tier
  SELECT tier INTO v_user_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Insert or update usage tracking record with tier_at_time
  INSERT INTO public.usage_tracking (user_id, month, tier_at_time)
  VALUES (p_user_id, p_month, v_user_tier)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Increment the specific counter
  CASE p_counter_name
    WHEN 'reflections' THEN
      UPDATE public.usage_tracking
      SET reflections = reflections + 1
      WHERE user_id = p_user_id AND month = p_month;
    WHEN 'reflection_count' THEN  -- Legacy support
      UPDATE public.usage_tracking
      SET reflection_count = reflection_count + 1
      WHERE user_id = p_user_id AND month = p_month;
    WHEN 'evolution_dream_specific' THEN
      UPDATE public.usage_tracking
      SET evolution_dream_specific = evolution_dream_specific + 1
      WHERE user_id = p_user_id AND month = p_month;
    WHEN 'evolution_cross_dream' THEN
      UPDATE public.usage_tracking
      SET evolution_cross_dream = evolution_cross_dream + 1
      WHERE user_id = p_user_id AND month = p_month;
    WHEN 'visualizations_dream_specific' THEN
      UPDATE public.usage_tracking
      SET visualizations_dream_specific = visualizations_dream_specific + 1
      WHERE user_id = p_user_id AND month = p_month;
    WHEN 'visualizations_cross_dream' THEN
      UPDATE public.usage_tracking
      SET visualizations_cross_dream = visualizations_cross_dream + 1
      WHERE user_id = p_user_id AND month = p_month;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_usage_counter IS
'Increment usage counter for a specific month. Automatically creates tracking record with tier_at_time if not exists.
Supported counters: reflections, evolution_dream_specific, evolution_cross_dream, visualizations_dream_specific, visualizations_cross_dream';
