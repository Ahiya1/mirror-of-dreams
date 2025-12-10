# Builder Task Breakdown - Dashboard Component Tests

## Overview

2 primary builders will work in parallel on separate component test suites.
No dependencies between builders - they can work completely independently.

## Builder Assignment Strategy

- Builder-1: Card components with tRPC queries (higher complexity)
- Builder-2: Shared components and DashboardHero (foundation + medium complexity)
- Clear separation by directory to prevent file conflicts

---

## Builder-1: Card Component Tests

### Scope

Create comprehensive test suites for all dashboard card components that use tRPC queries:
- DreamsCard
- EvolutionCard
- ReflectionsCard
- VisualizationCard

### Complexity Estimate

**HIGH**

Multiple components, each with tRPC mocking, multiple states (loading/error/empty/data), and user interactions.

### Success Criteria

- [ ] DreamsCard tests achieve 80%+ coverage
- [ ] EvolutionCard tests achieve 80%+ coverage
- [ ] ReflectionsCard tests achieve 80%+ coverage
- [ ] VisualizationCard tests achieve 80%+ coverage
- [ ] All tests pass with `npm run test`

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/__tests__/DreamsCard.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/__tests__/EvolutionCard.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/__tests__/ReflectionsCard.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/__tests__/VisualizationCard.test.tsx`

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

#### DreamsCard.test.tsx Test Cases

1. **Rendering**
   - Renders card with title "Active Dreams"
   - Renders "View All" header action link to /dreams

2. **Loading State**
   - Shows CosmicLoader when isLoading
   - Shows "Loading your dreams..." text

3. **Error State**
   - Shows error overlay when query has error

4. **Empty State**
   - Renders empty state message when no dreams
   - Renders "Create Your First Dream" CTA button
   - CTA links to /dreams

5. **With Dreams Data**
   - Renders up to 3 dreams
   - Displays dream title for each dream
   - Shows correct category emoji for each category type
   - Shows "Reflect" button for each dream
   - Shows reflection count for each dream

6. **Days Left Display**
   - Shows "Xd left" for positive daysLeft
   - Shows "Today!" for daysLeft === 0
   - Shows "Xd overdue" for negative daysLeft
   - Applies urgency classes (overdue, soon, normal)

7. **Dream Limits**
   - Shows dream limit indicator "X / Y dreams"
   - Shows infinity symbol for unlimited tier

8. **Interactions**
   - Dream links navigate to /dreams/{id}
   - Click on "Reflect" button navigates to /reflection?dreamId={id}

#### EvolutionCard.test.tsx Test Cases

1. **Rendering**
   - Renders card with title "Evolution Insights"

2. **Loading State**
   - Shows loading state when queries are loading

3. **With Reports**
   - Renders report preview card when has reports
   - Shows "Latest Report" label
   - Shows report date formatted (month, day)
   - Shows evolution preview text (max 200 chars)
   - Shows reflection count meta
   - Shows dream title meta if available
   - Shows "View all reports" link
   - Shows "View Reports" button

4. **Without Reports - Eligible**
   - Shows "Ready to Generate" status
   - Shows eligibility message
   - Shows "Generate Report" button

5. **Without Reports - Not Eligible**
   - Shows "Keep Reflecting" status
   - Shows reason from eligibility data
   - Shows progress bar toward first report
   - Shows "Create Reflections" button

6. **Interactions**
   - Click report preview navigates to /evolution/{id}
   - Click "View all reports" navigates to /evolution
   - Click action buttons navigate correctly

#### ReflectionsCard.test.tsx Test Cases

1. **Rendering**
   - Renders card with title "Recent Reflections"
   - Renders "View All" header action link to /reflections

2. **Loading State**
   - Shows CosmicLoader when isLoading

3. **Error State**
   - Shows error overlay when query has error

4. **Empty State**
   - Renders "No Reflections Yet" message
   - Shows "Start Reflecting" CTA button
   - CTA links to /reflection

5. **With Reflections Data**
   - Renders up to 3 reflections
   - Renders ReflectionItem for each reflection
   - Passes correct props to ReflectionItem

#### VisualizationCard.test.tsx Test Cases

1. **Rendering**
   - Renders card with title "Visualizations"

2. **Loading State**
   - Shows loading state when query is loading

3. **With Visualization**
   - Renders visualization preview card
   - Shows style icon based on style type
   - Shows style label capitalized
   - Shows visualization date
   - Shows narrative preview text (max 150 chars)
   - Shows reflection count
   - Shows dream title if available
   - Shows "View all visualizations" link
   - Shows "View All" button

4. **Empty State**
   - Shows "Create Your First Visualization" message
   - Shows "Create Visualization" button

5. **Interactions**
   - Click preview navigates to /visualizations/{id}
   - Click "View all visualizations" navigates to /visualizations
   - Click action buttons navigate correctly

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use tRPC mock pattern for all queries
- Use test data factories for dreams, reflections, evolution reports, visualizations
- Follow loading/error/empty/data state testing pattern
- Use Next.js router mock for navigation assertions

### Testing Requirements

- Unit tests for all rendering states
- Unit tests for user interactions
- Coverage target: 80%+ per component

---

## Builder-2: Shared Component Tests

### Scope

Create comprehensive test suites for dashboard shared components and DashboardHero:
- DashboardCard (foundation component)
- ReflectionItem
- DashboardHero

### Complexity Estimate

**MEDIUM**

DashboardCard is the foundation used by all cards. ReflectionItem has time formatting logic. DashboardHero has time-based greeting.

### Success Criteria

- [ ] DashboardCard tests achieve 80%+ coverage
- [ ] ReflectionItem tests achieve 80%+ coverage
- [ ] DashboardHero tests achieve 80%+ coverage
- [ ] All tests pass with `npm run test`

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/DashboardCard.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/ReflectionItem.test.tsx`
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/__tests__/DashboardHero.test.tsx`

### Dependencies

**Depends on:** None
**Blocks:** None

### Implementation Notes

#### DashboardCard.test.tsx Test Cases

1. **Rendering**
   - Renders children content
   - Applies base dashboard-card class
   - Applies variant class (default, premium, creator)
   - Applies custom className

2. **Loading State**
   - Shows loading overlay when isLoading
   - Shows spinner in loading overlay
   - Applies dashboard-card--loading class

3. **Error State**
   - Shows error overlay when hasError
   - Shows error icon and message
   - Applies dashboard-card--error class

4. **Hover Behavior**
   - Adds hovered class on mouseenter
   - Removes hovered class on mouseleave
   - Does not add hovered class when hoverable=false

5. **Click Behavior**
   - Adds clickable class when onClick provided
   - Calls onClick handler when clicked
   - Creates ripple effect element on click

6. **Sub-components**
   - CardHeader renders with correct class
   - CardTitle renders with icon and text
   - CardContent renders with inner class
   - CardActions renders with correct class
   - HeaderAction renders as button when onClick provided
   - HeaderAction renders as link when href provided

#### ReflectionItem.test.tsx Test Cases

1. **Rendering**
   - Renders as a Link to /reflections/{id}
   - Displays dream title (from joined dreams or reflection title)
   - Shows "Reflection" as fallback title
   - Displays preview text (max 120 chars)

2. **Time Formatting**
   - Shows "just now" for <1 min
   - Shows "Xm ago" for minutes
   - Shows "Xh ago" for hours
   - Shows "Xd ago" for days
   - Shows formatted date for >7 days

3. **Tone Badge**
   - Displays "Gentle" for gentle tone
   - Displays "Intense" for intense tone
   - Displays "Fusion" for fusion tone
   - Falls back to "Fusion" for unknown tones

4. **Premium Badge**
   - Shows "Premium" badge when is_premium=true
   - Hides premium badge when is_premium=false

5. **Interactions**
   - Calls onClick when provided
   - Shows hover indicator on hover state

6. **Preview Text**
   - Truncates content to 120 characters
   - Strips HTML/markdown from preview
   - Shows fallback text when no content

#### DashboardHero.test.tsx Test Cases

1. **Time-Based Greeting**
   - Shows "Good morning" for 5am-12pm
   - Shows "Good afternoon" for 12pm-6pm
   - Shows "Good evening" for 6pm-5am

2. **User Name Display**
   - Shows first name from user.name
   - Shows "Dreamer" as fallback when no name

3. **CTA Button**
   - Shows "Reflect Now" button
   - Button is enabled when user has active dreams
   - Button is disabled when no active dreams
   - Click navigates to /reflection when enabled

4. **Empty State Hint**
   - Shows hint to create first dream when no active dreams
   - Hint contains link to /dreams
   - Hides hint when user has active dreams

5. **Motivational Copy**
   - Shows different copy based on dream state
   - "Your dreams are waiting to be heard" when has dreams
   - "When you're ready, name what you're holding" when no dreams

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use framer-motion mock pattern for DashboardCard
- Use useAuth mock pattern for DashboardHero
- Use time mocking pattern with `vi.useFakeTimers()` for DashboardHero
- Use reflection factory for ReflectionItem

### Testing Requirements

- Unit tests for all rendering states
- Unit tests for sub-components
- Unit tests for user interactions
- Coverage target: 80%+ per component

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

- **Builder-1**: Card component tests (DreamsCard, EvolutionCard, ReflectionsCard, VisualizationCard)
- **Builder-2**: Shared component tests (DashboardCard, ReflectionItem, DashboardHero)

Both builders can start immediately and work in parallel.

### Integration Notes

**No file conflicts expected** - builders work in separate directories:
- Builder-1: `components/dashboard/cards/__tests__/`
- Builder-2: `components/dashboard/shared/__tests__/` and `components/dashboard/__tests__/`

**Shared patterns**: Both builders should use the same mocking patterns from `patterns.md` to ensure consistency.

**Verification after completion**:
1. Run `npm run test` to verify all tests pass
2. Run `npm run test:coverage` to verify 80%+ coverage targets
3. Ensure no regressions in existing TierBadge tests

---

## Estimated Effort

| Component | Estimate | Builder |
|-----------|----------|---------|
| DreamsCard | 45 min | Builder-1 |
| EvolutionCard | 45 min | Builder-1 |
| ReflectionsCard | 30 min | Builder-1 |
| VisualizationCard | 30 min | Builder-1 |
| DashboardCard | 45 min | Builder-2 |
| ReflectionItem | 45 min | Builder-2 |
| DashboardHero | 30 min | Builder-2 |

**Total per builder**: ~2.5 hours
**Total iteration**: ~2.5 hours (parallel execution)
