# Test coverage gaps

Generated from `npm run test:coverage` on branch `bryn/split-contexts-and-coverage`
(14 suites, 110 tests, all passing).

Coverage is collected from every file under `app/`, `context/`, and `services/`
(see `collectCoverageFrom` in `package.json`), so files with no tests count as 0%.
Without that setting Jest only reports files a test happens to import, which
showed a misleading 87% lines.

## Overall

| Metric     | Coverage |
| ---------- | -------- |
| Statements | 48.05%   |
| Branches   | 39.71%   |
| Functions  | 40.36%   |
| Lines      | 49.03%   |

By folder (lines): `app/` 61.7%, `app/(tabs)/` 21.0%, `app/components/` 5.1%,
`context/` 75.1%, `services/` 36.0%, `app/(auth)/` and `app/auth/` 0%.

## Least-covered files

### No tests at all (0%)

| File | Size | Notes |
| ---- | ---- | ----- |
| `app/(tabs)/index.tsx` | ~390 lines | Home feed: search, filtering, own-item vs. borrow actions |
| `app/index.tsx` | ~470 lines | |
| `app/(tabs)/chat.tsx` | ~330 lines | Chat list, search, "No chats found" / "No messages yet" |
| `app/(auth)/login.tsx` | ~220 lines | Sign-in / sign-up form |
| `app/(tabs)/search.tsx` | ~200 lines | |
| `app/community-info.tsx` | ~180 lines | Member list, role labels, leave (owner can't leave) |
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
| `context/ItemsContext.tsx` | 67% | 50% | `createItem`, `updateItem`, `deleteItem` bodies |
| `context/BorrowingContext.tsx` | 71% | 50% | every mutation: request, cancel, decline, approve, return |
| `app/(tabs)/profile.tsx` | 74% | 71% | 36-37, 45-47, 95, 152-172, 234 |
| `app/item/[id].tsx` | 75% | 57% | 68-78, 99-100, 189-243 (borrow / contact actions) |
| `app/edit-item.tsx` | 79% | 66% | 61-62, 100-106, 131-132, 165-179 (delete error paths) |
| `context/CommunityContext.tsx` | 82% | 50% | `createCommunity`, `requestToJoin` |
| `app/chat-thread.tsx` | 89% | 67% | 46-54, 109, 135, 149, 217, 254 |
| `app/edit-profile.tsx` | 89% | 59% | 37-38, 65 |
| `context/contextUtils.ts` | 91% | 47% | 61-62 (thrown error during load) |

The new context files are only tested through the deprecated `useDatabase()`
in `__tests__/DatabaseContext.test.tsx`. Screen tests mock `useDatabase`, so
they never run the context code.

## Missing test cases, by priority

### P1: Error paths

1. **Load throws, not just returns an error.** `useUserScopedLoad` has a
   `catch` for a rejected promise, such as no network (`contextUtils.ts:61-62`).
   Make `items.getMine` reject and check that `error` holds the message,
   `loading` goes back to false, and the other contexts still load.
2. **Each mutation surfaces its RPC error.** For every mutation in
   `ItemsContext`, `BorrowingContext`, `CommunityContext`, and
   `ProfileContext.updateProfile`, return `{ error: { message } }` and check
   that the call rejects and local state is unchanged. None of these are
   tested today.
3. **`approveRequest` / `markReturned` failure.** If the RPC fails, neither
   borrowing nor items should refresh.
4. **`approveRequest` / `markReturned` success refreshes both contexts.**
   Check that `borrowing_requests.getMine` and `items.getMine` are each called
   again, and that `communities.getMine` and `profiles.getCurrent` are not.
   The second half is new behavior from the context split.
5. **Per-context error isolation.** A failing `communities.getMine` should
   set only `useCommunities().error`. `useItems().error` stays null, and the
   combined `useDatabase().error` shows the community error.
6. **`getProfile` RPC error.** Returns `null`, is not cached, and clears the
   in-flight entry so a retry makes a new call.
7. **Screen error states with no tests:** `community-info.tsx` "Couldn't load
   this community" and the "Couldn't leave" alert; `chat.ts`
   `getCommunityDetails` "Community not found"; `edit-item.tsx` delete
   failure (lines 165-179); `edit-profile.tsx` save failure branch.

### P1: Sign-out mid-load

8. **Sign out while a load is in flight.** Hold `items.getMine` on a
   promise you resolve by hand, switch `useAuth` to `{ user: null }`, then
   resolve it. `myItems` must stay `[]` and `loading` must be false.
   This is the stale-request check, and nothing tests it directly.
9. **Switch users mid-load.** User A's slow response arrives after user B's
   load starts. Only B's data should be shown.
10. **Sign out clears the profile caches.** After sign-out and sign-in as
    someone else, `profilesById` is empty and `getProfile` calls the server
    again rather than returning the old user's cached profile.
11. **Sign out during a mutation.** `approveRequest` resolves after sign-out.
    The follow-up refresh must not repopulate the old user's lists.
12. **`AuthContext`** is at 0%: session restore, sign-out, and the
    `user` changes that drive all the above.

### P2: Role permissions (Owner, Admin, Member)

Roles appear in `app/community-info.tsx` and `services/chat.ts`, and none of
that code has tests.

13. **Owner** taps Leave: the "You're the owner" alert appears and
    `leaveCommunity` is **not** called.
14. **Admin** and **Member** tap Leave: the confirm dialog appears, and
    confirming calls `leaveCommunity` and navigates to `/chat`.
15. **Role labels:** owner shows "Owner", admin shows "Admin", member shows
    no label. The current user is marked "(you)".
16. **Member sort order:** owner, then admins, then members, then by name
    within each role (`roleRank`).
17. **Admin-only actions** (`community_members.approve/decline/setRole/remove`,
    `isAdmin`) have API wrappers but no UI or tests yet. Add tests when the
    screens that use them are built.
18. **Item ownership** is a similar permission check. `edit-item.tsx`
    "only edit your own items" is already tested. `app/(tabs)/index.tsx`
    (own item vs. someone else's) and `app/item/[id].tsx` lines 189-243
    (borrow/contact actions shown to non-owners) are not.

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

1. Add `__tests__/contextUtils.test.ts` for `unwrap`, `replaceById`,
   `collectResults`, and `useUserScopedLoad`, including stale-request and
   sign-out. Most of P1 is cheapest to test here.
2. Add `BorrowingContext` and `ItemsContext` tests that use `useBorrowing` /
   `useItems` directly, rather than through `useDatabase`.
3. Add `community-info.tsx` tests for roles.
4. Add tests for the chat list and bookmark empty states.
