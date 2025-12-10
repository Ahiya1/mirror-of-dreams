# Builder Task Breakdown

## Overview

2 primary builders will work in parallel on separate hook test files.
No splits anticipated - both tasks are well-scoped.

## Builder Assignment Strategy

- Builders work on completely isolated test files
- No shared mocks to create (each builder creates mocks inline)
- Both use existing fixtures from `test/fixtures/form-data.ts`
- No dependencies between builders

---

## Builder-1: useReflectionForm Tests

### Scope

Create comprehensive test coverage for the `useReflectionForm` hook (169 lines). This hook manages reflection form state, validation, localStorage persistence, and dream selection.

### Complexity Estimate

**HIGH**

- Multiple useEffect hooks to test
- localStorage interactions (save/load/expiry/clear)
- ToastContext integration for validation
- Dream selection with dreams array dependency

### Success Criteria

- [ ] Test file created at `hooks/__tests__/useReflectionForm.test.ts`
- [ ] 35+ test cases covering all functionality
- [ ] 85%+ code coverage for useReflectionForm.ts
- [ ] All tests pass with `npm test`
- [ ] Tests follow patterns from useMobileReflectionFlow.test.ts

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useReflectionForm.test.ts` - Main test file (~400 lines)

### Dependencies

**Depends on:** None (can start immediately)
**Blocks:** Nothing

### Implementation Notes

1. **Mock Setup (at top of file):**
   - ToastContext mock with success/error/warning/info methods
   - localStorage mock (copy pattern from useMobileReflectionFlow.test.ts)

2. **Test Categories to Implement:**
   - Initialization (5 tests)
   - Dream selection (4 tests)
   - Form field changes (5 tests)
   - Validation (7 tests)
   - localStorage persistence - save (5 tests)
   - localStorage persistence - load (4 tests)
   - localStorage expiry (2 tests)
   - Clear form (5 tests)
   - SSR safety (1 test)
   - Error handling (2 tests)

3. **Key Hook Methods to Test:**
   - `handleFieldChange(field, value)` - Updates formData
   - `handleDreamSelect(dreamId)` - Updates selectedDreamId and selectedDream
   - `validateForm()` - Returns boolean, shows toast on error
   - `clearForm()` - Resets all state and clears localStorage
   - `setSelectedTone(tone)` - Updates tone selection

4. **Key State to Test:**
   - `formData` - Form field values
   - `selectedDreamId` - Current dream ID string
   - `selectedDream` - Dream object or null
   - `selectedTone` - ToneId (default: 'fusion')

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use localStorage mock pattern for persistence tests
- Use ToastContext mock pattern for validation tests
- Use rerender pattern for testing dreams array loading
- Use createSavedFormState factory for localStorage load tests

### Testing Requirements

- Unit tests for all public methods and state
- Edge case tests for whitespace validation
- Error handling tests for localStorage failures
- SSR safety test

### Test Case Checklist

```
Initialization (5 tests):
- [ ] initializes with empty form data when no saved state exists
- [ ] initializes with initialDreamId when provided
- [ ] initializes selectedTone to 'fusion' by default
- [ ] initializes selectedDream as null
- [ ] initializes formData as EMPTY_FORM_DATA

Dream Selection (4 tests):
- [ ] handleDreamSelect updates selectedDreamId
- [ ] handleDreamSelect updates selectedDream when dream found in dreams array
- [ ] handleDreamSelect sets selectedDream to null when dream not found
- [ ] updates selectedDream when dreams array loads (useEffect)

Form Field Changes (5 tests):
- [ ] handleFieldChange updates dream field
- [ ] handleFieldChange updates plan field
- [ ] handleFieldChange updates relationship field
- [ ] handleFieldChange updates offering field
- [ ] handleFieldChange preserves other fields when updating one

Validation (7 tests):
- [ ] validateForm returns false and shows toast when no dream selected
- [ ] validateForm returns false and shows toast when dream field empty
- [ ] validateForm returns false and shows toast when plan field empty
- [ ] validateForm returns false and shows toast when relationship field empty
- [ ] validateForm returns false and shows toast when offering field empty
- [ ] validateForm returns true when all fields have content
- [ ] validateForm trims whitespace when validating

LocalStorage Save (5 tests):
- [ ] saves form data to localStorage when content changes
- [ ] saves dreamId to localStorage
- [ ] saves tone to localStorage
- [ ] saves timestamp to localStorage
- [ ] does not save when form is empty and no dreamId

LocalStorage Load (4 tests):
- [ ] loads saved form data on mount
- [ ] loads saved dreamId on mount
- [ ] loads saved tone on mount
- [ ] handles malformed JSON gracefully

LocalStorage Expiry (2 tests):
- [ ] removes expired data (older than 24 hours)
- [ ] loads fresh data (within 24 hours)

Clear Form (5 tests):
- [ ] clearForm resets formData to EMPTY_FORM_DATA
- [ ] clearForm resets selectedDreamId to empty string
- [ ] clearForm resets selectedDream to null
- [ ] clearForm resets selectedTone to 'fusion'
- [ ] clearForm removes STORAGE_KEY from localStorage

SSR Safety (1 test):
- [ ] handles window undefined gracefully

Error Handling (2 tests):
- [ ] handles localStorage errors gracefully on save
- [ ] handles localStorage errors gracefully on load
```

---

## Builder-2: useReflectionViewMode Tests

### Scope

Create comprehensive test coverage for the `useReflectionViewMode` hook (63 lines). This hook manages view mode state, URL parameter synchronization, and new reflection handling.

### Complexity Estimate

**MEDIUM**

- Single useEffect for URL sync
- Next.js navigation mock needed
- History API mock for resetToQuestionnaire
- Simpler state management than Builder-1

### Success Criteria

- [ ] Test file created at `hooks/__tests__/useReflectionViewMode.test.ts`
- [ ] 20+ test cases covering all functionality
- [ ] 85%+ code coverage for useReflectionViewMode.ts
- [ ] All tests pass with `npm test`
- [ ] Tests follow patterns from useMobileReflectionFlow.test.ts

### Files to Create

- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useReflectionViewMode.test.ts` - Main test file (~200 lines)

### Dependencies

**Depends on:** None (can start immediately)
**Blocks:** Nothing

### Implementation Notes

1. **Mock Setup (at top of file):**
   - Next.js navigation mock (useSearchParams)
   - History API mock (replaceState)

2. **Test Categories to Implement:**
   - Initialization (5 tests)
   - View mode sync with URL (4 tests)
   - New reflection handling (3 tests)
   - Reset functionality (4 tests)
   - Return value completeness (2 tests)

3. **Key Hook Methods to Test:**
   - `setViewMode(mode)` - Updates view mode state
   - `setNewReflection(ref)` - Updates new reflection
   - `resetToQuestionnaire()` - Resets state and URL

4. **Key State to Test:**
   - `viewMode` - 'questionnaire' | 'output'
   - `reflectionId` - From URL params
   - `dreamIdFromUrl` - From URL params
   - `newReflection` - NewReflection | null

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use navigation mock pattern with mutable searchParams
- Use history mock pattern for replaceState
- Use rerender pattern for testing URL parameter changes

### Testing Requirements

- Unit tests for all public methods and state
- URL sync behavior tests
- Edge case tests for newReflection preventing sync
- Reset functionality tests

### Test Case Checklist

```
Initialization (5 tests):
- [ ] initializes viewMode to 'questionnaire' when no id in URL
- [ ] initializes viewMode to 'output' when id exists in URL
- [ ] reads reflectionId from searchParams
- [ ] reads dreamIdFromUrl from searchParams
- [ ] initializes newReflection as null

View Mode Sync (4 tests):
- [ ] syncs viewMode to 'output' when reflectionId appears in URL
- [ ] syncs viewMode to 'questionnaire' when reflectionId removed from URL
- [ ] does not sync viewMode when newReflection exists (prevents override)
- [ ] handles multiple URL param changes correctly

New Reflection Handling (3 tests):
- [ ] setNewReflection updates newReflection state
- [ ] setNewReflection with null clears newReflection
- [ ] setting newReflection prevents viewMode sync from URL

Reset Functionality (4 tests):
- [ ] resetToQuestionnaire sets viewMode to 'questionnaire'
- [ ] resetToQuestionnaire sets newReflection to null
- [ ] resetToQuestionnaire calls history.replaceState with '/reflection'
- [ ] resetToQuestionnaire works when already on questionnaire

Return Value Completeness (2 tests):
- [ ] returns all expected state properties
- [ ] returns all expected action functions

Edge Cases (2 tests):
- [ ] handles empty URL params
- [ ] setViewMode allows manual override
```

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

Both builders can start immediately and work in parallel:
- **Builder-1**: useReflectionForm tests
- **Builder-2**: useReflectionViewMode tests

### Integration Notes

**No conflicts expected:**
- Builder-1 creates: `hooks/__tests__/useReflectionForm.test.ts`
- Builder-2 creates: `hooks/__tests__/useReflectionViewMode.test.ts`
- Both use existing fixtures (no modifications needed)
- No shared mock files needed (mocks are inline in each test file)

**Post-builder verification:**
```bash
# Run all hook tests
npm test -- hooks/__tests__

# Check coverage for specific files
npm test -- --coverage hooks/__tests__/useReflectionForm.test.ts
npm test -- --coverage hooks/__tests__/useReflectionViewMode.test.ts
```

---

## Reference Files

### Must Read Before Starting

Both builders should review:
1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/__tests__/useMobileReflectionFlow.test.ts` - Pattern reference (995 lines)
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/form-data.ts` - Available fixtures

### Builder-1 Specific
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useReflectionForm.ts` - Hook under test (169 lines)
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx` - Toast interface

### Builder-2 Specific
5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useReflectionViewMode.ts` - Hook under test (63 lines)
6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/types.ts` - ViewMode, NewReflection types

### Shared Constants
7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/reflection/constants.ts` - STORAGE_KEY, STORAGE_EXPIRY_MS, EMPTY_FORM_DATA

---

## Completion Checklist

Before marking complete, verify:

### Builder-1
- [ ] All 35+ tests pass
- [ ] Coverage report shows 85%+ for useReflectionForm.ts
- [ ] No TypeScript errors
- [ ] Tests are organized by category with describe blocks

### Builder-2
- [ ] All 20+ tests pass
- [ ] Coverage report shows 85%+ for useReflectionViewMode.ts
- [ ] No TypeScript errors
- [ ] Tests are organized by category with describe blocks

### Final Validation
- [ ] `npm test` passes with no failures
- [ ] No regressions in existing tests
- [ ] Test files follow project conventions
