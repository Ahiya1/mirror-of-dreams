# Demo Content Summary

**Status:** Generated via AI in seeding script

**Overview:**
Demo user reflections are generated programmatically using Claude Sonnet 4.5 with premium features (extended thinking, 6000 max tokens). This ensures authentic, high-quality content that showcases the product at its best.

## Demo Dreams (5 Total)

1. **Launch My SaaS Product** (Career)
   - 4 reflections (enables evolution report)
   - Target: 45 days from now
   - Priority: High
   - Demonstrates: Entrepreneurial journey, technical challenges, validation

2. **Run a Marathon** (Health)
   - 3 reflections
   - Target: 120 days from now
   - Priority: Medium
   - Demonstrates: Physical goals, training consistency, body awareness

3. **Learn Piano** (Creative)
   - 3 reflections
   - Target: Ongoing (no deadline)
   - Priority: Low
   - Demonstrates: Artistic pursuits, patience, mastery mindset

4. **Build Meaningful Relationships** (Relationships)
   - 3 reflections
   - Target: 1 year from now
   - Priority: High
   - Demonstrates: Vulnerability, emotional intelligence, intentionality

5. **Achieve Financial Freedom** (Financial)
   - 2 reflections
   - Target: 2 years from now
   - Priority: Medium
   - Demonstrates: Long-term planning, passive income strategies

**Total Reflections:** 15 (spread over 42 days)

## Reflection Quality Standards

All demo reflections follow these quality standards:

- **Authenticity:** Real struggles, not marketing copy
- **Depth:** 200-400 words per user reflection
- **Specificity:** Concrete details, not vague aspirations
- **Emotional Range:** Fear, confidence, doubt, excitement
- **Tone Variety:** Mix of fusion (3), gentle (2), intense (1) per dream
- **Temporal Spread:** Created over 42 days to show evolution

## AI Response Features

- **Premium Quality:** Extended thinking (5000 tokens budget)
- **Max Tokens:** 6000 (vs. 4000 for standard tier)
- **Tone Accuracy:** Matches user-selected tone (fusion/gentle/intense)
- **Personalization:** References specific details from user's reflection
- **Actionability:** Concrete insights and next steps

## Seeding Process

Demo content is generated via `scripts/seed-demo-user.ts`:

1. Fetch demo user (created by migration)
2. Delete existing demo data (clean slate)
3. Create 5 dreams
4. For each dream:
   - Loop through reflection templates
   - Generate AI response via Anthropic API
   - Insert reflection with realistic timestamp
   - Wait 1 second between API calls (rate limiting)
5. Update user stats (total_reflections, reflection_count_this_month)

**Estimated Time:** 5-10 minutes (15 AI calls @ 20-40s each)
**Estimated Cost:** ~$0.86 (one-time, premium tier API usage)

## Quality Gate

Demo content will be manually reviewed for:
- Authenticity (not generic/marketing)
- Emotional depth (vulnerable, real)
- AI quality (insights, not platitudes)
- Diversity (different life areas, tones)

**Approval Required:** Ahiya must approve before production deployment.
