# Test Action

1. Read current-feature.md to understand what was implemented
2. Identify server actions and utility functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Create unit tests using Vitest
   - Focus on server actions and utilities (not components)
   - Test happy path and error cases
   - Put the test next to the source file (`src/lib/foo.ts` → `src/lib/foo.test.ts`)
   - Mock `@/auth`, `@/lib/prisma`, email and Upstash with `vi.mock` (see `src/actions/profile.test.ts`)
   - Do not write tests just to write them. Use your best judgement
5. Run `npm run test:run` to verify all tests pass
6. Report test coverage for the new feature code