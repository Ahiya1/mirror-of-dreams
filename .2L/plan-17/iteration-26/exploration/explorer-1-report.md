# Explorer 1 Report: Architecture & Structure for Core Fixes

## Executive Summary

This iteration addresses two critical bugs in the Clarify Agent: (1) a tier limit mismatch in `/server/trpc/routers/dreams.ts` using old tier names instead of the current `free/pro/unlimited` system, and (2) the missing `createDream` tool integration in `/server/trpc/routers/clarify.ts` that prevents Claude from actually creating dreams. The database schema already supports both `tool_use` and `dream_id` fields - only backend code changes are needed.

## Discoveries

### 1. Tier Limits Bug Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

**Lines 12-17:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },    // BUG: Should be 'pro'
  optimal: { dreams: 7 },      // BUG: Should be removed
  premium: { dreams: 999999 }, // BUG: Should be 'unlimited'
} as const;
```

**Correct Configuration (from `/lib/utils/constants.ts` lines 15-19):**
```typescript
export const DREAM_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: Infinity,
} as const;
```

**Impact:** Users with `pro` tier are being treated as having 0 dream limit (undefined lookup), and `unlimited` users get no limit at all (undefined).

**Files Using Old Tier Names:**
- `/server/trpc/routers/dreams.ts` - lines 12-17 (NEEDS FIX)
- `/lib/schema.sql` - line 26: Still references `'free', 'essential', 'premium'` (database-level, may have legacy data)
- `/server/trpc/routers/admin.ts` - lines 46, 145-147 (reads legacy data, provides mapping)
- Various UI files have mappings for backwards compatibility (app/admin/page.tsx lines 112-114)

### 2. createDream Tool Integration Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

**Current Claude API Calls (missing tools parameter):**

**Lines 188-195 (createSession with initialMessage):**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: [
    { role: 'user', content: input.initialMessage }
  ],
  // MISSING: tools parameter
});
```

**Lines 351-356 (sendMessage):**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
  // MISSING: tools parameter
});
```

**Required Tool Definition (from Anthropic SDK):**
```typescript
const createDreamTool = {
  name: 'createDream',
  description: 'Creates a new dream for the user when they have clearly articulated what they want to pursue and are ready to commit to tracking it.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A concise title for the dream (max 200 chars)'
      },
      description: {
        type: 'string',
        description: 'Optional longer description of the dream (max 2000 chars)'
      },
      category: {
        type: 'string',
        enum: ['health', 'career', 'relationships', 'financial', 'personal_growth', 'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'],
        description: 'Category that best fits this dream'
      }
    },
    required: ['title']
  }
};
```

**Response Handling Pattern Needed:**

Currently (lines 197-199, 358-361):
```typescript
const textBlock = response.content.find(block => block.type === 'text');
if (textBlock && textBlock.type === 'text') {
  initialResponse = textBlock.text;
}
```

**Required Pattern:**
```typescript
// Check for tool_use blocks
const toolUseBlock = response.content.find(block => block.type === 'tool_use');
const textBlock = response.content.find(block => block.type === 'text');

if (toolUseBlock && toolUseBlock.type === 'tool_use') {
  // Execute the tool
  if (toolUseBlock.name === 'createDream') {
    const toolInput = toolUseBlock.input as { title: string; description?: string; category?: string };
    
    // Reuse dreams.create logic
    const dream = await createDreamFromTool(userId, toolInput);
    
    // Store tool_use in message
    const toolUse = {
      name: 'createDream',
      input: toolInput,
      result: { dreamId: dream.id, success: true }
    };
    
    // Update session with dream_id
    await supabase.from('clarify_sessions')
      .update({ dream_id: dream.id })
      .eq('id', sessionId);
    
    // Return tool result to Claude for acknowledgment
    const followUp = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        ...anthropicMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUseBlock.id, content: JSON.stringify({ success: true, dreamId: dream.id }) }] }
      ],
    });
  }
}
```

### 3. Database Schema Verification

**clarify_messages.tool_use Column:**
- **Status:** EXISTS
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251210000000_clarify_agent.sql`
- **Line 71:** `tool_use JSONB`
- **Type Definition:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` lines 22-33

```typescript
export interface ClarifyToolUse {
  name: 'createDream';
  input: {
    title: string;
    description?: string;
    category?: string;
  };
  result?: {
    dreamId: string;
    success: boolean;
  };
}
```

**clarify_sessions.dream_id Foreign Key:**
- **Status:** EXISTS
- **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251210000000_clarify_agent.sql`
- **Line 26:** `dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL`
- **Type Definition:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` line 47: `dreamId: string | null;`

### 4. Dreams Router Reuse Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

**create mutation (lines 161-215):**
- Validates with `createDreamSchema` (lines 23-42)
- Checks tier limits (should be fixed first!)
- Inserts to `dreams` table with: user_id, title, description, target_date, category, priority, status
- Returns usage stats

**For tool integration, extract/reuse:**
1. Input schema validation (title, description, category)
2. Supabase insert logic
3. Skip limit check for AI-created dreams? Or check and inform Claude of limit

### 5. Prompt Already Instructs Tool Use

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt`

**Lines 31-36:**
```
This person may be exploring something that could become a formal dream they track. 
If something crystallizes clearly AND they express readiness to commit to it, you may 
offer to create a dream for them using the createDream tool. But:
- Only offer this when there's genuine clarity and readiness
- Always ask permission first: "Would you like to add this as a dream to track?"
- Never pressure or suggest they "should" create a dream
```

The prompt references `createDream tool` but the API call does not include it.

## Complexity Assessment

### High Complexity Areas

**createDream Tool Integration (6-8 hours)**
- Requires modifying 2 Claude API calls
- Must handle tool_use response blocks
- Must send tool_result back to Claude
- Must store tool_use in database
- Must update session.dream_id
- Integration with existing dreams.create logic

### Medium Complexity Areas

**Tier Limits Fix (30 minutes)**
- Simple constant replacement
- But need to consider backwards compatibility with existing users who have `essential` or `premium` tiers in database

### Low Complexity Areas

**Database Schema**
- Already complete, no changes needed
- Types already defined

## Recommendations for Planner

### 1. Fix Tier Limits First (Quick Win)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`
**Change:** Replace TIER_LIMITS constant with correct tier names:
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
} as const;
```
**Note:** Consider also importing from `/lib/utils/constants.ts` DREAM_LIMITS for single source of truth.

### 2. Implement createDream Tool in Two Phases

**Phase A: Add tool to API call (simpler)**
1. Define createDreamTool constant
2. Add `tools: [createDreamTool]` to both API calls
3. Test that Claude recognizes and attempts to use the tool

**Phase B: Handle tool_use response (more complex)**
1. Detect tool_use blocks in response
2. Execute dream creation (reuse dreams router logic)
3. Store tool_use in message record
4. Update session.dream_id
5. Return tool_result to Claude
6. Get Claude's acknowledgment message

### 3. Consider Streaming Separately
The current iteration focuses on core fixes. Streaming can be added as a follow-up enhancement that builds on the working tool_use implementation.

### 4. Helper Function Recommendation
Create a standalone `createDreamFromTool` helper that:
- Accepts (userId, { title, description, category })
- Performs limit check (with graceful handling for AI context)
- Inserts dream
- Returns dream record

This separates concerns from the router and enables reuse.

## Resource Map

### Critical Files for Modification

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` | Dream CRUD | Fix TIER_LIMITS (lines 12-17) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` | Clarify Agent | Add tools param (lines 188, 351), handle tool_use response |

### Supporting Files (Reference Only)

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` | Canonical tier limits (DREAM_LIMITS) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` | ClarifyToolUse type definition |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt` | System prompt (already mentions tool) |

### Database Migrations (Already Applied)

| File | Relevant Schema |
|------|-----------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251210000000_clarify_agent.sql` | tool_use JSONB, dream_id FK |

## Code Snippets for Implementation

### Fix 1: Tier Limits (dreams.ts lines 12-17)

```typescript
// Option A: Direct fix
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
} as const;

// Option B: Import from constants (preferred for consistency)
import { DREAM_LIMITS } from '@/lib/utils/constants';

const TIER_LIMITS = {
  free: { dreams: DREAM_LIMITS.free },
  pro: { dreams: DREAM_LIMITS.pro },
  unlimited: { dreams: DREAM_LIMITS.unlimited === Infinity ? 999999 : DREAM_LIMITS.unlimited },
} as const;
```

### Fix 2: createDream Tool Definition (clarify.ts)

Add near top of file after imports:

```typescript
// =====================================================
// CREATEDREAM TOOL DEFINITION
// =====================================================

const createDreamTool = {
  name: 'createDream',
  description: 'Creates a new dream for the user when they have clearly articulated what they want to pursue and are ready to commit to tracking it. Only use this when the user has expressed genuine clarity and readiness, and after asking their permission.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'A concise, meaningful title for the dream (max 200 characters)'
      },
      description: {
        type: 'string',
        description: 'Optional longer description capturing the essence of the dream (max 2000 characters)'
      },
      category: {
        type: 'string',
        enum: ['health', 'career', 'relationships', 'financial', 'personal_growth', 'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'],
        description: 'The category that best fits this dream'
      }
    },
    required: ['title']
  }
};
```

### Fix 3: Tool Execution Helper (clarify.ts)

```typescript
async function executeCreateDreamTool(
  userId: string,
  sessionId: string,
  toolInput: { title: string; description?: string; category?: string }
): Promise<{ dreamId: string; success: boolean }> {
  // Create the dream
  const { data: dream, error } = await supabase
    .from('dreams')
    .insert({
      user_id: userId,
      title: toolInput.title,
      description: toolInput.description,
      category: toolInput.category,
      status: 'active',
      pre_session_id: sessionId,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create dream via tool:', error);
    return { dreamId: '', success: false };
  }

  // Link session to dream
  await supabase
    .from('clarify_sessions')
    .update({ dream_id: dream.id })
    .eq('id', sessionId);

  return { dreamId: dream.id, success: true };
}
```

### Fix 4: Modified API Call with Tool Use Handling (clarify.ts sendMessage)

```typescript
// Generate AI response with tools
let aiResponse: string;
let tokenCount: number | null = null;
let toolUseRecord: ClarifyToolUse | null = null;

try {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    system: systemPrompt,
    messages: anthropicMessages,
    tools: [createDreamTool],
  });

  // Check for tool_use
  const toolUseBlock = response.content.find(block => block.type === 'tool_use');
  
  if (toolUseBlock && toolUseBlock.type === 'tool_use' && toolUseBlock.name === 'createDream') {
    const toolInput = toolUseBlock.input as { title: string; description?: string; category?: string };
    const toolResult = await executeCreateDreamTool(userId, input.sessionId, toolInput);
    
    toolUseRecord = {
      name: 'createDream',
      input: toolInput,
      result: toolResult,
    };

    // Get Claude's acknowledgment with tool result
    const followUp = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        ...anthropicMessages,
        { role: 'assistant', content: response.content },
        { 
          role: 'user', 
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult)
          }]
        }
      ],
      tools: [createDreamTool],
    });

    const followUpText = followUp.content.find(b => b.type === 'text');
    aiResponse = followUpText?.type === 'text' ? followUpText.text : '';
    tokenCount = (response.usage?.output_tokens || 0) + (followUp.usage?.output_tokens || 0);
  } else {
    // Standard text response
    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }
    aiResponse = textBlock.text;
    tokenCount = response.usage?.output_tokens || null;
  }
} catch (aiError: any) {
  console.error('Claude API error:', aiError);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to generate response. Please try again.',
  });
}

// Store AI response with tool_use if applicable
const { data: assistantMsg, error: assistantMsgError } = await supabase
  .from('clarify_messages')
  .insert({
    session_id: input.sessionId,
    role: 'assistant',
    content: aiResponse,
    token_count: tokenCount,
    tool_use: toolUseRecord,  // Will be null if no tool was used
  })
  .select()
  .single();
```

## Questions for Planner

1. **Backwards Compatibility:** Should the fix handle users who still have `essential` or `premium` in their database `tier` column? May need a migration or fallback mapping.

2. **Tool Limit Handling:** When Claude tries to create a dream and the user is at their limit, should we:
   - Return an error to Claude so it can inform the user?
   - Silently fail and let Claude's acknowledgment message handle it?
   - Check limit before providing tool (remove tool from available tools if at limit)?

3. **Streaming Integration:** Is streaming part of this iteration or a follow-up? The current scope focuses on fixing the core tool_use mechanism.

4. **Testing Strategy:** Should we add unit tests for the tool execution, or is manual testing sufficient for this iteration?

## Summary

The two main bugs are straightforward to understand:
1. **Tier mismatch**: Old tier names in `dreams.ts` - 5 minute fix
2. **Missing tool integration**: Claude API calls lack `tools` parameter and response handling - 4-6 hours

Database schema is ready. Types are defined. Prompt already instructs Claude to use the tool. The only work is wiring up the API calls correctly.
