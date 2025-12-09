# Code Patterns & Conventions

## Console.log Removal Patterns

### Pattern 1: Remove Debug Logs, Keep Error Logs

**When to use:** For all production code files

**Before:**
```typescript
console.log('Starting operation...');
console.log('Input received:', JSON.stringify(input, null, 2));
console.log('User:', ctx.user.email, 'Tier:', ctx.user.tier);

try {
  const result = await doSomething();
  console.log('Operation succeeded:', result.id);
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

**After:**
```typescript
try {
  const result = await doSomething();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

**Key points:**
- DELETE: `console.log()` with debug/info messages
- DELETE: `console.log()` that logs sensitive data (emails, user info)
- KEEP: `console.error()` for actual error handling
- KEEP: `console.warn()` for important warnings

### Pattern 2: Remove Emoji Debug Logs

**When to use:** Files with decorated debug statements

**Before:**
```typescript
console.log('Calling Anthropic API...');
console.log('Prompt length:', userPrompt.length, 'characters');
console.log('AI response generated:', aiResponse.length, 'characters');
console.log('Saving to database...');
console.log('Reflection created:', reflectionRecord.id);
```

**After:**
```typescript
// All removed - these are debug statements only
```

### Pattern 3: Payment/Webhook Logging (Special Case)

**When to use:** PayPal webhook handler, critical payment flows

**Decision:** For this iteration, convert verbose debug logs to minimal error-only logging.

**Before:**
```typescript
console.log('[PayPal] Webhook received:', event.event_type);
console.log('[PayPal] Processing subscription:', subscriptionId);
console.log('[PayPal] User found:', user.email);
console.log('[PayPal] Updating subscription status...');
console.log('[PayPal] Success!');
```

**After:**
```typescript
// Only keep error cases
if (!user) {
  console.error('[PayPal] User not found for subscription:', subscriptionId);
}
```

---

## TypeScript `any` Fix Patterns

### Pattern 1: Replace `error: any` with `unknown`

**When to use:** All catch blocks with typed errors

**Before:**
```typescript
try {
  await doSomething();
} catch (error: any) {
  setError(error.message);
  console.error('Failed:', error.message);
}
```

**After:**
```typescript
try {
  await doSomething();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  setError(message);
  console.error('Failed:', message);
}
```

**Key points:**
- Replace `error: any` with `error: unknown`
- Use type guard: `error instanceof Error`
- Access `.message` only after type guard
- Provide fallback for non-Error throws

### Pattern 2: Replace `(d: any)` with Proper Type

**When to use:** Array methods with untyped callbacks

**Before:**
```typescript
const dream = dreams.find((d: any) => d.id === selectedDreamId);
dreams.map((dream: any) => { ... })
{activeDreams.map((dream: any, index: number) => { ... })}
```

**After:**
```typescript
import { Dream } from '@/types';

const dream = dreams.find((d: Dream) => d.id === selectedDreamId);
dreams.map((dream: Dream) => { ... })
{activeDreams.map((dream: Dream, index: number) => { ... })}
```

### Pattern 3: Anthropic SDK Type Fixes

**When to use:** Files calling Anthropic API

**Before:**
```typescript
const requestConfig: any = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [{ role: 'user', content: prompt }],
};
```

**After:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const requestConfig: Anthropic.MessageCreateParams = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: [{ role: 'user', content: prompt }],
};
```

### Pattern 4: Extended Thinking Token Access

**When to use:** Files accessing thinking_tokens from Anthropic response

**Before:**
```typescript
const thinkingTokens = (response.usage as any).thinking_tokens || 0;
```

**After:**
```typescript
// Type assertion for extended thinking beta feature
interface ExtendedUsage extends Anthropic.Usage {
  thinking_tokens?: number;
}

const usage = response.usage as ExtendedUsage;
const thinkingTokens = usage.thinking_tokens || 0;
```

### Pattern 5: Settings Page Generic Handler

**When to use:** Settings toggle handlers

**Before:**
```typescript
const handleToggle = (key: keyof UserPreferences, value: any) => {
  updatePreferences({ ...preferences, [key]: value });
};
```

**After:**
```typescript
const handleToggle = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
) => {
  updatePreferences({ ...preferences, [key]: value });
};
```

---

## Hook Consolidation Pattern

### Moving Hooks to Consolidated Location

**Before (scattered):**
```
/hooks/
  useAuth.ts
  useDashboard.ts
  usePortalState.ts
  useBreathingEffect.ts
  useAnimatedCounter.ts
  useReducedMotion.ts
  useStaggerAnimation.ts
  (no index.ts)

/lib/hooks/
  useScrollDirection.ts
  useIsMobile.ts
  useKeyboardHeight.ts
  index.ts
```

**After (consolidated):**
```
/hooks/
  useAuth.ts
  useDashboard.ts
  usePortalState.ts
  useBreathingEffect.ts
  useAnimatedCounter.ts
  useReducedMotion.ts
  useStaggerAnimation.ts
  useScrollDirection.ts    <- moved from lib/hooks
  useIsMobile.ts           <- moved from lib/hooks
  useKeyboardHeight.ts     <- moved from lib/hooks
  index.ts                 <- new barrel export
```

### Barrel Export Creation

**File: `/hooks/index.ts`**
```typescript
// Authentication & State
export { useAuth } from './useAuth';
export { useDashboard } from './useDashboard';
export { usePortalState } from './usePortalState';

// Animation & Effects
export { useBreathingEffect } from './useBreathingEffect';
export { useAnimatedCounter } from './useAnimatedCounter';
export { useStaggerAnimation } from './useStaggerAnimation';

// Accessibility
export { useReducedMotion } from './useReducedMotion';

// Viewport & Input
export { useScrollDirection, type ScrollDirection } from './useScrollDirection';
export { useIsMobile } from './useIsMobile';
export { useKeyboardHeight } from './useKeyboardHeight';
```

### Import Update Pattern

**Before:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { useKeyboardHeight } from '@/lib/hooks';
```

**After:**
```typescript
import { useAuth, useIsMobile, useScrollDirection, useKeyboardHeight } from '@/hooks';
```

---

## File Deletion Pattern

### Safe Deletion Checklist

Before deleting any file or directory:

1. **Verify no imports:**
   ```bash
   grep -r "from.*<path>" --include="*.ts" --include="*.tsx" --include="*.js"
   ```

2. **Check for dynamic imports:**
   ```bash
   grep -r "import(<path>)" --include="*.ts" --include="*.tsx"
   ```

3. **Verify not in build config:**
   - Check `next.config.js`
   - Check `tsconfig.json` paths

4. **Confirm with build:**
   ```bash
   npm run build
   ```

### Directory Deletion Commands

```bash
# Delete entire /src/ directory
rm -rf /src/

# Delete legacy infrastructure files
rm backend-server.js dev-proxy.js vite.config.js index.html create-component.js setup-react.js

# Delete public HTML directories (after confirming empty)
rm -rf public/auth public/dashboard public/portal public/profile public/reflections \
       public/mirror public/about public/evolution public/stewardship \
       public/transition public/creator public/commitment public/examples public/shared
```

---

## Glass Index.ts Update Pattern

### Remove Orphaned Exports

**Before:**
```typescript
// Glass Design System - Barrel Export

// Foundation Components
export { GlassCard } from './GlassCard';
export { GlowButton } from './GlowButton';
export { GradientText } from './GradientText';
export { GlassInput } from './GlassInput';

// Complex Components
export { DreamCard } from './DreamCard';         // <-- orphaned
export { GlassModal } from './GlassModal';
export { FloatingNav } from './FloatingNav';     // <-- orphaned

// Specialty Components
export { CosmicLoader } from './CosmicLoader';
export { ProgressOrbs } from './ProgressOrbs';
export { GlowBadge } from './GlowBadge';
export { AnimatedBackground } from './AnimatedBackground';
```

**After:**
```typescript
// Glass Design System - Barrel Export

// Foundation Components
export { GlassCard } from './GlassCard';
export { GlowButton } from './GlowButton';
export { GradientText } from './GradientText';
export { GlassInput } from './GlassInput';

// Complex Components
export { GlassModal } from './GlassModal';

// Specialty Components
export { CosmicLoader } from './CosmicLoader';
export { ProgressOrbs } from './ProgressOrbs';
export { GlowBadge } from './GlowBadge';
export { AnimatedBackground } from './AnimatedBackground';
```

**Note:** Also delete the actual component files:
- `/components/ui/glass/DreamCard.tsx`
- `/components/ui/glass/FloatingNav.tsx`

And update `/app/design-system/page.tsx` to remove imports.

---

## Package.json Cleanup Pattern

### Remove Legacy Scripts

**Before:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:old": "node dev-proxy.js",
    "dev:react": "vite",
    "dev:backend": "node backend-server.js",
    "build": "next build",
    "start": "next start"
  }
}
```

**After:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### Remove Legacy Dependencies

```bash
npm uninstall @vitejs/plugin-react express http-proxy-middleware vite
```

---

## Verification Commands

After each builder completes, run:

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Lint (if configured)
npm run lint
```
