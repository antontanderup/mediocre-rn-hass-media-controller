# Plan: Move Authentication to Its Own Stack/Screen

## Goal
- Authentication (checking for Home Assistant credentials/token) should be handled in a dedicated screen/stack.
- If not authenticated, only this screen is visible, with a button to go to settings.
- Use existing hooks/context for auth state; do not introduce new hooks.

## Steps

1. **Create Auth Screen/Stack**
	- Add a new screen (e.g., `app/auth.tsx` or a stack under `app/(auth)/`).
	- This screen displays a message about authentication and a button to open the settings screen.

2. **Move Auth Logic**
	- Move the logic that checks for authentication (currently in root layout or elsewhere) into the new Auth screen/stack.
	- Use the existing context/hook (e.g., `useHassConfig`) to determine if credentials/token are present.

3. **Update Root Layout**
	- In `app/_layout.tsx`, check authentication state using the existing logic.
	- If not authenticated, render only the Auth screen/stack.
	- If authenticated, render the main app stack/screens as before.

4. **Settings Navigation**
	- The Auth screen's button should navigate to the settings screen (`app/settings.tsx`).
	- When credentials are saved in settings, the app should reactively switch to the main app stack.

5. **(Optional) Navigation Structure**
	- For clarity, consider grouping screens using Expo Router layouts: `(auth)` for unauthenticated, `(main)` for authenticated.

## Notes
- Do not create new hooks or context; only move and reorganize existing logic.
- All authentication state should be derived from the current implementation (e.g., `useHassConfig`).
- The Auth screen is purely a gate: it blocks access to the rest of the app until credentials are present.

---
