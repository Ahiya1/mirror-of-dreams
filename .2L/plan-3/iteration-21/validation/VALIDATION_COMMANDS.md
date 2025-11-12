# Validation Commands Reference

Quick reference for re-running validation checks.

## TypeScript Compilation

```bash
npx tsc --noEmit
```

**Expected:** No output (0 errors)

---

## Production Build

```bash
npm run build
```

**Expected:** Build succeeds, ~15 pages generated, bundle sizes displayed

---

## Security Audit

```bash
npm audit
```

**Expected:** 0 critical, 0 high vulnerabilities

---

## Development Server

```bash
npm run dev
```

**Expected:** Server starts at http://localhost:3000

---

## Code Inspection

### Check for alert() calls
```bash
grep -r "alert(" app/ server/ components/ --exclude-dir=node_modules
```

**Expected:** No results (all replaced with toast notifications)

### Check for console.log (debug statements)
```bash
grep -r "console\.log" app/ server/ components/ --exclude-dir=node_modules
```

**Expected:** Only console.error for error logging (acceptable)

### Verify AppNavigation usage
```bash
grep -r "AppNavigation" app/ --include="*.tsx"
```

**Expected:** Found in 7 pages (dashboard, dreams, evolution, visualizations, detail pages)

### Verify ToastProvider in layout
```bash
grep "ToastProvider" app/layout.tsx
```

**Expected:** ToastProvider wraps {children}

### Verify CosmicLoader usage
```bash
grep -r "CosmicLoader" app/ --include="*.tsx" | wc -l
```

**Expected:** 11+ instances

---

## Database Setup (Manual)

### Apply migration
```bash
# Via Supabase CLI
supabase db push

# Or via Supabase SQL Editor
# Copy/paste: supabase/migrations/20251113_add_onboarding_flag.sql
```

### Create admin user
```bash
node scripts/create-admin-user.js
```

### Verify admin user
```sql
-- Run in Supabase SQL Editor
SELECT id, email, is_admin, is_creator, tier, onboarding_completed
FROM users
WHERE email = 'ahiya.butman@gmail.com';
```

**Expected:** 1 row with is_admin=TRUE, is_creator=TRUE, tier='premium', onboarding_completed=TRUE

---

## Manual Testing Checklist

### Sarah's Journey (Day 0-8)
1. Visit http://localhost:3000
2. Click "Start Free"
3. Sign up with new email (test+[random]@example.com)
4. Verify onboarding appears (3 steps)
5. Complete or skip onboarding
6. Verify redirect to /dashboard
7. Create a new dream
8. Complete 4 reflections on that dream
9. Verify "Evolution Report Available" message
10. Generate evolution report
11. Verify markdown renders beautifully
12. Generate visualization
13. Verify immersive display

### Admin User Flow
1. Sign in with ahiya.butman@gmail.com / mirror-creator
2. Verify redirect to /dashboard (not /onboarding)
3. Verify "Admin" link appears in navigation
4. Click Admin link
5. Verify admin features accessible

### Navigation Consistency
1. Visit each page: /dashboard, /dreams, /evolution, /visualizations
2. Verify AppNavigation appears on all pages
3. Verify active page highlighting works
4. Verify user menu dropdown works
5. Verify mobile menu works (resize browser <1024px)

### Error Handling
1. Disconnect network, try submitting reflection
2. Verify beautiful toast error appears (not alert())
3. Submit invalid form data
4. Verify validation messages appear
5. Try generating evolution with <4 reflections
6. Verify eligibility message appears

---

## Performance Testing (Manual)

### Lighthouse Audit
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Mobile" or "Desktop"
4. Click "Generate report"
5. Verify scores:
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >80

### Bundle Size Analysis
```bash
npm run build
```

Check output for bundle sizes:
- Shared chunks: <100 KB
- Landing page: <150 KB
- Dashboard: <250 KB

---

## Deployment Commands

### Vercel Deployment
```bash
# Ensure .env.example is up to date
cat .env.example

# Merge to main
git checkout main
git merge iteration-21-final

# Push to GitHub (triggers Vercel build)
git push origin main

# Monitor Vercel dashboard for build status
```

### Environment Variables (Vercel Dashboard)
Required variables:
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- JWT_SECRET
- NEXT_PUBLIC_APP_URL
- (Optional) STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

---

## Post-Deployment Smoke Test

1. Visit production URL
2. Test signup flow
3. Test onboarding (complete or skip)
4. Test dashboard loads
5. Test creating a dream
6. Test reflection submission
7. Test navigation between pages
8. Test user menu dropdown
9. Test mobile responsiveness
10. Check browser console for errors (F12)

---

## Rollback (If Issues)

```bash
# Revert last commit
git revert HEAD

# Push to GitHub
git push origin main

# Vercel automatically deploys previous version
```

---

**Last Updated:** 2025-11-13 (Iteration 21)
