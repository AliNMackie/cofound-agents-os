# IC Origin - Phase 1 Completion Checklist

This document summarizes the changes made to achieve "Integration & Polish" for the IC Origin frontend.

## 1. Repository Cleanup
- **Deleted**: `services/ic-origin-site` (It was an unused placeholder).
- **Canonical Frontend**: `services/vesper-gtm/dashboard` is now the single source of truth for the frontend application.

## 2. Environment Variables (Action Required)
We renamed the API URL variable to be more descriptive and avoid conflicts.

- **Old Variable**: `NEXT_PUBLIC_API_URL`
- **New Variable**: `NEXT_PUBLIC_SENTINEL_API_URL`

> [!IMPORTANT]
> **Production Update Required**: Please log in to Netlify (or your hosting provider) and rename the environment variable `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_SENTINEL_API_URL`.
> The code currently has a fallback to support the old name temporarily, but this will be removed in future phases.

## 3. Verification Scaffolding
- **Build**: `npm run build` passes in `services/vesper-gtm/dashboard`.
- **E2E Testing**: Established a Playwright test suite.
- **Smoke Test**: Created `tests/ic-origin-smoke.spec.ts` which verifies the app launches and the Newsroom page loads.

## 4. Next Steps (Phase 2)
- Implement real backend polling for Morning Pulse (Partially started).
- Build "Zombie Hunter" watchlist upload UI.
- Build "Shadow Market" signals UI.
