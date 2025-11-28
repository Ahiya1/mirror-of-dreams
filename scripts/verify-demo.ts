import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, is_demo, tier, total_reflections')
    .eq('is_demo', true)
    .single();

  console.log('Demo User:', user);

  const { data: dreams } = await supabase
    .from('dreams')
    .select('id, title, category, priority')
    .eq('user_id', user!.id);

  console.log('\nDreams:', dreams?.length);
  dreams?.forEach(d => console.log('  -', d.title, '(' + d.category + ', priority:', d.priority + ')'));

  const { data: reflections } = await supabase
    .from('reflections')
    .select('id, tone, word_count')
    .eq('user_id', user!.id);

  console.log('\nReflections:', reflections?.length);

  const { data: reports } = await supabase
    .from('evolution_reports')
    .select('id')
    .eq('user_id', user!.id);

  console.log('Evolution Reports:', reports?.length || 0);
}

verify();
