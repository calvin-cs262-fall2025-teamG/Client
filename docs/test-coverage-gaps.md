# Test coverage gaps

Generated from `npm run test:coverage` on branch `bryn/more-tests`
(23 suites, 220 tests passing, 2 skipped for known bugs).

Coverage is collected from every file under `app/`, `context/`, and `services/`
(see `collectCoverageFrom` in `package.json`), so files with no tests count as 0%.
Without that setting Jest only reports files a test happens to import, which
showed a misleading 87% lines.

This branch does not include the Discover work from
`bryn/community-filter-and-discovery` (ItemCard, ItemRow, the new Discover
screen, `utils/confirm.ts`), so those files aren't in these numbers.

## Overall

| Metric     | Coverage | Before more tests | Before priority tests |
| ---------- | -------- | ----------------- | --------------------- |
| Statements | 67.89%   | 52.96%            | 48.05%                |
| Branches   | 60.26%   | 45.26%            | 39.71%                |
| Functions  | 59.81%   | 46.93%            | 40.36%                |
| Lines      | 68.67%   | 54.09%            | 49.03%                |

By folder (lines): `app/` 75.1%, `app/(auth)/` 60.9%, `app/(tabs)/` 52.1%,
`app/components/` 5.1%, `context/` 99.0%, `services/` 38.7%, `app/auth/` 0%.

## Known bugs found by the tests

### Fixed

- **Refresh after sign-out** (`context/BorrowingContext.tsx`). `approveRequest`
  and `markReturned` refreshed borrowing data and items after their RPC even if
  the user had signed out while the call was in flight, which brought the old
  user's lists back. They now skip the refresh when no one is signed in. Tests:
  `__tests__/context-sign-out.test.tsx` (both actions).

### Open (tests marked `it.skip`)

- **Unverified email on login goes nowhere** (`app/(auth)/login.tsx`).
  Supabase reports an unconfirmed account as "Email not confirmed" (code
  `email_not_confirmed`), but the screen only looks for "not verified",
  "verification" or "verify" in the message. The user sees the raw error
  instead of being sent to Verify Email. Checking `err.code ===
  "email_not_confirmed"` would fix it. Test: `__tests__/login.test.tsx`.
- **No email format check on sign up** (`app/(auth)/login.tsx`). An address
  like `not-an-email` is sent straight to `signup`. Test:
  `__tests__/login.test.tsx`.

Also noted, not marked as a bug: the "Please enter a password" and "Please
enter your name" messages in `login.tsx` can never appear, because the submit
button is disabled until those fields are filled. Empty fields give no message,
only a disabled button.

## Least-covered files

### No tests at all (0%)

| File | Size | Notes |
| ---- | ---- | ----- |
| `app/(tabs)/index.tsx` | ~415 lines | Home feed (replaced on the Discover branch) |
| `app/index.tsx` | ~490 lines | Onboarding |
| `app/(tabs)/search.tsx` | ~215 lines | Replaced by Discover on the Discover branch |
| `app/HelpDetails.tsx`, `app/HelpList.tsx` | | Mostly static content |
| `app/auth/callback.tsx`, `app/(auth)/verify-email.tsx` | | Email confirmation flow |
| `app/borrow-confirmation.tsx` | | |
| `app/components/BookmarkButton.tsx`, `BookmarkHeaderIcon.tsx`, `CloseButton.tsx` | | |
| `services/supabase_api.ts`, `authServices.ts`, `api.ts` | | Thin RPC wrappers, always mocked in tests |

### Partly covered (lowest first, by lines)

| File | Lines | Branches | Uncovered |
| ---- | ----- | -------- | --------- |
| `services/chat.ts` | 61% | 20% | 59-60, 137-164 (community details, leave) |
| `app/bookmark.tsx` | 67% | 80% | 24, 54-75 (back, remove and toggle buttons); was 0% |
| `app/(tabs)/profile.tsx` | 74% | 71% | 36-37, 45-47, 95, 152-172, 234 |
| `app/item/[id].tsx` | 75% | 57% | 68-78, 99-100, 189-243 (borrow / contact actions) |
| `app/edit-item.tsx` | 79% | 66% | 61-62, 100-106, 131-132, 165-179 (delete error paths) |
| `app/(tabs)/chat.tsx` | 89% | 79% | 54-62 (avatar images), 123-124, 178-180 (pull to refresh); was 0% |
| `app/chat-thread.tsx` | 89% | 69% | 46-54, 109, 135, 149, 217, 254 |
| `app/edit-profile.tsx` | 89% | 59% | 37-38, 65 |
| `app/(auth)/login.tsx` | 91% | 93% | 37-38, 42-43 (the unreachable validation messages); was 0% |
| `app/community-thread.tsx` | 93% | 73% | 47, 62, 106-109 |
| `context/AuthContext.tsx` | 98% | 80% | 80 (app returning to the foreground); was 0% |
| `context/ItemsContext.tsx` | 100% | 50% | was 79% |
| `context/BorrowingContext.tsx` | 100% | 60% | was 89% |
| `context/CommunityContext.tsx` | 100% | 50% | was 91% |
| `context/ProfileContext.tsx` | 100% | 90% | was 95% |
| `services/supabaseAuth.ts` | 100% | 100% | was 0% |

The context branch numbers are low because of the `useX must be used inside
<Provider>` checks, which no test renders outside a provider.

## Missing test cases, by priority

### P1: Error paths

- [x] **Load throws, not just returns an error.** `__tests__/contextUtils.test.ts`
  and `__tests__/contexts.test.tsx`: `error` is set, `loading` goes back to
  false, and the other contexts still load.
- [x] **Each mutation surfaces its RPC error.** Every mutation in
  `ItemsContext`, `BorrowingContext`, `CommunityContext`, and
  `updateProfile` rejects and leaves local state unchanged.
- [x] **`approveRequest` / `markReturned` failure** refreshes nothing.
- [x] **`approveRequest` / `markReturned` success** refreshes borrowing data
  and items, but not profile or communities.
- [x] **Per-context error isolation.** A failing `communities.getMine` sets
  only `useCommunities().error`.
- [x] **`getProfile` RPC error.** Returns `null`, is not cached, and a retry
  makes a new call. `__tests__/context-success.test.tsx`.
- [x] **Mutation success paths through the specific hooks.** `createItem`,
  `updateItem`, `deleteItem`, `requestToBorrow`, `cancelRequest`,
  `declineRequest`, `createCommunity`, `updateProfile` update local state.
  `__tests__/context-success.test.tsx`.
- Screen error states:
  - [x] `community-info.tsx` "Couldn't load this community" and "Couldn't leave"
  - [x] `chat.tsx` failed conversation load, thrown request, and a failed
    community message load
  - [x] `login.tsx` login and sign-up errors, including the fallback message
  - [ ] `chat.ts` `getCommunityDetails` "Community not found"
  - [ ] `edit-item.tsx` delete failure (lines 165-179)
  - [ ] `edit-profile.tsx` save failure branch

### P1: Sign-out mid-load

- [x] **Sign out while a load is in flight.** `myItems` stays `[]` and
  `loading` is false.
- [x] **Switch users mid-load.** A's slow response is dropped whether it
  arrives before or after B's.
- [x] **Sign out clears the profile caches.** After signing back in as
  someone else, `profilesById` is empty and `getProfile` asks the server again.
- [x] **Sign out during a mutation.** Fixed; `approveRequest` and
  `markReturned` both tested.
- [x] **`AuthContext`**: session restore (with and without a session, failed
  restore, missing profile), login and signup success and failure (including
  email not confirmed), sign-out, auth state changes, and removing the
  listener on unmount. `__tests__/AuthContext.test.tsx`.

### P1: Auth screens

- [x] **Login / Sign up toggle**, with the name field only on Sign up.
- [x] **Empty fields** don't call `login` or `signup`.
- [ ] **Invalid email** shows a message. Skipped: there is no format check.
- [x] **Sign up** goes to Verify Email; **Log in** goes to the tabs.
- [ ] **Unverified email on login** goes to Verify Email. Works for messages
  containing "verified"; skipped for Supabase's real "Email not confirmed".
- [ ] `verify-email.tsx` and `auth/callback.tsx` have no tests.

### P2: Role permissions (Owner, Admin, Member)

`__tests__/community-info.test.tsx`:

- [x] **Owner** taps Leave: the "You're the owner" alert appears and
  `leaveCommunity` is not called.
- [x] **Admin** and **Member** tap Leave: the confirm dialog appears, and
  confirming calls `leaveCommunity` and navigates to `/chat`. Cancelling
  does nothing.
- [x] **Role labels:** "Owner", "Admin", no label for members, and "(you)"
  on the current user only.
- [x] **Member sort order:** owner, then admins, then members, then by name.
- [ ] **Admin-only actions** (`community_members.approve/decline/setRole/remove`,
  `isAdmin`) have API wrappers but no UI or tests yet. Add tests when the
  screens that use them are built.
- [ ] **Item ownership** in `app/(tabs)/index.tsx` (own item vs. someone
  else's) and `app/item/[id].tsx` lines 189-243 (actions shown to
  non-owners). `edit-item.tsx` "only edit your own items" is already tested.

### P3: Empty states

| Screen | Empty state | Tested? |
| ------ | ----------- | ------- |
| `requests.tsx` | "No requests yet" | Yes |
| `(tabs)/profile.tsx` | "No listings yet" | Yes |
| `(tabs)/list.tsx` | "Join a community first" | Yes |
| `(tabs)/chat.tsx` | "No messages yet" / "No chats found" (with a search query) | Yes |
| `bookmark.tsx` | "No bookmarks yet" | Yes |
| `chat-thread.tsx` | "No messages yet" | Yes |
| `community-thread.tsx` | "No messages yet. Say hi to your neighbors!" | Yes |
| `(tabs)/index.tsx` | no items match the filter | No |
| `community-info.tsx` | community with only you as a member | No |

Also add context-level empty-state tests: each list loads as `[]` (not
`null`) when the RPC returns `data: null` with no error.

## Suggested order

1. ~~Add `__tests__/contextUtils.test.ts`, including stale-request and
   sign-out.~~ Done.
2. ~~Add `BorrowingContext` and `ItemsContext` tests through the specific
   hooks.~~ Done, error and success paths.
3. ~~Add `community-info.tsx` tests for roles.~~ Done.
4. ~~Fix the sign-out-during-mutation bug and un-skip its test.~~ Done.
5. ~~Add tests for the chat list and bookmark empty states.~~ Done.
6. ~~Add tests for `AuthContext`.~~ Done.
7. Fix the two `login.tsx` bugs and un-skip their tests.
8. After merging the Discover branch, rerun coverage and add the Discover
   screen, ItemCard, ItemRow, and `utils/confirm.ts` to this report.
9. Add tests for `verify-email.tsx`, `auth/callback.tsx`, and the remaining
   screen error states.
