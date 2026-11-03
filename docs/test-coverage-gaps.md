# Test coverage gaps

Generated from `npm run test:coverage` on branch `bryn/priority-tests`
(18 suites, 153 tests passing, 1 skipped for a known bug).

Coverage is collected from every file under `app/`, `context/`, and `services/`
(see `collectCoverageFrom` in `package.json`), so files with no tests count as 0%.
Without that setting Jest only reports files a test happens to import, which
showed a misleading 87% lines.

## Overall

| Metric     | Coverage | Before priority tests |
| ---------- | -------- | --------------------- |
| Statements | 52.96%   | 48.05%                |
| Branches   | 45.26%   | 39.71%                |
| Functions  | 46.93%   | 40.36%                |
| Lines      | 54.09%   | 49.03%                |

By folder (lines): `app/` 73.4%, `app/(tabs)/` 21.0%, `app/components/` 5.1%,
`context/` 80.3%, `services/` 36.0%, `app/(auth)/` and `app/auth/` 0%.

## Known bug found by the tests

`approveRequest` and `markReturned` (`context/BorrowingContext.tsx`) call
`refresh()` and the items refresh after their RPC resolves, without checking
that a user is still signed in. If the user signs out while the call is in
flight, a new load starts with no session and its results (or errors) are
applied to the signed-out state. The test is in
`__tests__/context-sign-out.test.tsx` and is marked `it.skip` until the app
code is fixed.

## Least-covered files

### No tests at all (0%)

| File | Size | Notes |
| ---- | ---- | ----- |
| `app/(tabs)/index.tsx` | ~390 lines | Home feed: search, filtering, own-item vs. borrow actions |
| `app/index.tsx` | ~470 lines | |
| `app/(tabs)/chat.tsx` | ~330 lines | Chat list, search, "No chats found" / "No messages yet" |
| `app/(auth)/login.tsx` | ~220 lines | Sign-in / sign-up form |
| `app/(tabs)/search.tsx` | ~200 lines | |
| `app/HelpDetails.tsx`, `app/HelpList.tsx` | | Mostly static content |
| `app/bookmark.tsx` | ~115 lines | "No bookmarks yet" empty state |
| `context/AuthContext.tsx` | ~105 lines | Session, sign-in/out; every other context depends on it |
| `app/auth/callback.tsx`, `app/(auth)/verify-email.tsx` | | Email confirmation flow |
| `app/borrow-confirmation.tsx` | | |
| `app/components/BookmarkButton.tsx`, `BookmarkHeaderIcon.tsx`, `CloseButton.tsx` | | |
| `services/supabase_api.ts`, `supabaseAuth.ts`, `authServices.ts`, `api.ts` | | Thin RPC wrappers, always mocked in tests |

### Partly covered (lowest first, by lines)

| File | Lines | Branches | Uncovered |
| ---- | ----- | -------- | --------- |
| `services/chat.ts` | 61% | 20% | 59-60, 137-164 (community details, leave) |
| `app/(tabs)/profile.tsx` | 74% | 71% | 36-37, 45-47, 95, 152-172, 234 |
| `app/item/[id].tsx` | 75% | 57% | 68-78, 99-100, 189-243 (borrow / contact actions) |
| `app/edit-item.tsx` | 79% | 66% | 61-62, 100-106, 131-132, 165-179 (delete error paths) |
| `context/ItemsContext.tsx` | 79% | 50% | success paths of `createItem`, `updateItem`, `deleteItem` |
| `app/chat-thread.tsx` | 89% | 67% | 46-54, 109, 135, 149, 217, 254 |
| `app/edit-profile.tsx` | 89% | 59% | 37-38, 65 |
| `context/BorrowingContext.tsx` | 89% | 50% | success paths of `requestToBorrow`, `cancelRequest`, `declineRequest` |
| `context/CommunityContext.tsx` | 91% | 50% | success path of `createCommunity` |
| `context/ProfileContext.tsx` | 95% | 90% | 63-64 (`updateProfile` success) |
| `app/community-info.tsx` | 100% | 77% | was 0% |
| `context/contextUtils.ts` | 100% | 89% | was 91% |

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
- [ ] **`getProfile` RPC error.** Returns `null`, is not cached, and clears the
  in-flight entry so a retry makes a new call.
- [ ] **Mutation success paths through the specific hooks.** `createItem`,
  `updateItem`, `deleteItem`, `requestToBorrow`, `cancelRequest`,
  `declineRequest`, `createCommunity`, `updateProfile` update local state.
- Screen error states:
  - [x] `community-info.tsx` "Couldn't load this community" and "Couldn't leave"
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
- [ ] **Sign out during a mutation.** Test written but skipped. It fails
  because of the bug described above.
- [ ] **`AuthContext`** is at 0%: session restore, sign-out, and the
  `user` changes that drive all the above.

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
| `(tabs)/chat.tsx` | "No messages yet" / "No chats found" (with a search query) | No |
| `bookmark.tsx` | "No bookmarks yet" | No |
| `chat-thread.tsx` | "No messages yet" | No |
| `community-thread.tsx` | "No messages yet. Say hi to your neighbors!" | No |
| `(tabs)/index.tsx` | no items match the filter | No |
| `community-info.tsx` | community with only you as a member | No |

Also add context-level empty-state tests: each list loads as `[]` (not
`null`) when the RPC returns `data: null` with no error.

## Suggested order

1. ~~Add `__tests__/contextUtils.test.ts`, including stale-request and
   sign-out.~~ Done.
2. ~~Add `BorrowingContext` and `ItemsContext` tests through the specific
   hooks.~~ Error paths done; success paths remain.
3. ~~Add `community-info.tsx` tests for roles.~~ Done.
4. Fix the sign-out-during-mutation bug and un-skip its test.
5. Add tests for the chat list and bookmark empty states.
6. Add tests for `AuthContext`.
