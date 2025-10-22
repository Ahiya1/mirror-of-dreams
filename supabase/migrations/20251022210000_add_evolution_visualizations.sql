-- =====================================================
-- Migration: Add Evolution Reports + Visualizations (Iteration 3)
-- Date: 2025-10-22
-- =====================================================

-- 1. Update evolution_reports table
-- Add dream_id and report_category columns
ALTER TABLE public.evolution_reports
ADD COLUMN IF NOT EXISTS dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS report_category TEXT CHECK (report_category IN ('dream-specific', 'cross-dream'));

-- Add index for dream_id lookups
CREATE INDEX IF NOT EXISTS idx_evolution_reports_dream_id ON public.evolution_reports(dream_id);

-- Update existing evolution_reports to be cross-dream (legacy)
UPDATE public.evolution_reports
SET report_category = 'cross-dream'
WHERE report_category IS NULL;

-- 2. Create visualizations table
CREATE TABLE IF NOT EXISTS public.visualizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Visualization details
    style TEXT NOT NULL CHECK (style IN ('achievement', 'spiral', 'synthesis')),
    narrative TEXT NOT NULL,
    artifact_url TEXT, -- Future: generated image URL

    -- Metadata
    reflections_analyzed UUID[] NOT NULL,
    reflection_count INTEGER NOT NULL,

    CONSTRAINT visualizations_reflection_count_positive CHECK (reflection_count > 0)
);

-- RLS for visualizations
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visualizations"
  ON public.visualizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visualizations"
  ON public.visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visualizations"
  ON public.visualizations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for visualizations
CREATE INDEX IF NOT EXISTS idx_visualizations_user_id ON public.visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_dream_id ON public.visualizations(dream_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_created_at ON public.visualizations(created_at DESC);

-- 3. Create or update api_usage_log table
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.api_usage_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Operation details
    operation_type TEXT NOT NULL,
    model_used TEXT NOT NULL,

    -- Token usage
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    thinking_tokens INTEGER DEFAULT 0,

    -- Cost tracking
    cost_usd DECIMAL(10, 6) NOT NULL,

    -- Optional metadata
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
    metadata JSONB
);

-- Add constraint with all operation types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_usage_log_operation_type_check'
  ) THEN
    ALTER TABLE public.api_usage_log
    ADD CONSTRAINT api_usage_log_operation_type_check CHECK (
      operation_type IN ('reflection', 'evolution_dream', 'evolution_cross', 'visualization')
    );
  END IF;
END $$;

-- RLS for api_usage_log
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own usage logs' AND tablename = 'api_usage_log'
  ) THEN
    CREATE POLICY "Users can view own usage logs"
      ON public.api_usage_log FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all usage logs' AND tablename = 'api_usage_log'
  ) THEN
    CREATE POLICY "Admins can view all usage logs"
      ON public.api_usage_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.is_admin = true
        )
      );
  END IF;
END $$;

-- Indexes for api_usage_log
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_dream_id ON public.api_usage_log(dream_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON public.api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_operation_type ON public.api_usage_log(operation_type);

-- 4. Update usage_tracking table
-- Add evolution and visualization counters
ALTER TABLE public.usage_tracking
ADD COLUMN IF NOT EXISTS evolution_dream_specific INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS evolution_cross_dream INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visualizations_dream_specific INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visualizations_cross_dream INTEGER DEFAULT 0;

-- Add check constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_evolution_dream_positive') THEN
    ALTER TABLE public.usage_tracking
    ADD CONSTRAINT usage_tracking_evolution_dream_positive CHECK (evolution_dream_specific >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_evolution_cross_positive') THEN
    ALTER TABLE public.usage_tracking
    ADD CONSTRAINT usage_tracking_evolution_cross_positive CHECK (evolution_cross_dream >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_viz_dream_positive') THEN
    ALTER TABLE public.usage_tracking
    ADD CONSTRAINT usage_tracking_viz_dream_positive CHECK (visualizations_dream_specific >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_tracking_viz_cross_positive') THEN
    ALTER TABLE public.usage_tracking
    ADD CONSTRAINT usage_tracking_viz_cross_positive CHECK (visualizations_cross_dream >= 0);
  END IF;
END $$;

-- 5. Create helper function to check evolution limits
CREATE OR REPLACE FUNCTION check_evolution_limit(
  p_user_id UUID,
  p_user_tier TEXT,
  p_report_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_month_start DATE;
  v_usage_record RECORD;
  v_limit INTEGER;
BEGIN
  -- Get current month start
  v_current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- Get or create usage record for current month
  SELECT * INTO v_usage_record
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND month = v_current_month_start;

  -- If no record exists, user can create (first one)
  IF v_usage_record IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Determine limit based on tier and report type
  IF p_report_type = 'dream_specific' THEN
    v_limit := CASE p_user_tier
      WHEN 'free' THEN 1
      WHEN 'essential' THEN 3
      WHEN 'optimal' THEN 6
      WHEN 'premium' THEN 999999
      ELSE 0
    END;
    RETURN v_usage_record.evolution_dream_specific < v_limit;
  ELSIF p_report_type = 'cross_dream' THEN
    v_limit := CASE p_user_tier
      WHEN 'free' THEN 0  -- Not available for free tier
      WHEN 'essential' THEN 1
      WHEN 'optimal' THEN 3
      WHEN 'premium' THEN 999999
      ELSE 0
    END;
    RETURN v_usage_record.evolution_cross_dream < v_limit;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create helper function to check visualization limits
CREATE OR REPLACE FUNCTION check_visualization_limit(
  p_user_id UUID,
  p_user_tier TEXT,
  p_viz_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_month_start DATE;
  v_usage_record RECORD;
  v_limit INTEGER;
BEGIN
  -- Get current month start
  v_current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- Get or create usage record for current month
  SELECT * INTO v_usage_record
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND month = v_current_month_start;

  -- If no record exists, user can create (first one)
  IF v_usage_record IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Determine limit based on tier and viz type
  IF p_viz_type = 'dream_specific' THEN
    v_limit := CASE p_user_tier
      WHEN 'free' THEN 1
      WHEN 'essential' THEN 3
      WHEN 'optimal' THEN 6
      WHEN 'premium' THEN 999999
      ELSE 0
    END;
    RETURN v_usage_record.visualizations_dream_specific < v_limit;
  ELSIF p_viz_type = 'cross_dream' THEN
    v_limit := CASE p_user_tier
      WHEN 'free' THEN 0  -- Not available for free tier
      WHEN 'essential' THEN 1
      WHEN 'optimal' THEN 3
      WHEN 'premium' THEN 999999
      ELSE 0
    END;
    RETURN v_usage_record.visualizations_cross_dream < v_limit;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration Complete
-- =====================================================

-- 7. Create increment_usage_counter helper function
CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_month DATE,
  p_counter_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert or update usage tracking record
  INSERT INTO public.usage_tracking (user_id, month)
  VALUES (p_user_id, p_month)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Increment the specific counter
  CASE p_counter_name
    WHEN 'reflections' THEN
      UPDATE public.usage_tracking
      SET reflections = reflections + 1
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

