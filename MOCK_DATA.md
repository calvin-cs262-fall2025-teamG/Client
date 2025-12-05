## Mock Database - Sample Data

The mock database now includes test data with items from the cart and borrow requests.

### Users (5 total)

1. **Alice Johnson** (alice@example.com) - ID: 1
2. **Bob Smith** (bob@example.com) - ID: 2
3. **Bryn** (bryn@example.com) - ID: 3 ← Current user/borrower
4. **Charlie Kim** (charlie@example.com) - ID: 4 ← Owner of items 1 & 3
5. **Dana Lee** (dana@example.com) - ID: 5 ← Owner of item 2

### Items (3 total)

| ID | Name | Category | Owner | Status |
|----|------|----------|-------|--------|
| 1 | USB-C Charger | Electronics | Charlie Kim | Available |
| 2 | Office Chair | Furniture | Dana Lee | Available |
| 3 | Garden Tractor | Garden | Charlie Kim | Available |

### Borrow Requests (3 total)

All made by **Bryn** (user_id: 3):

| Request ID | Item | Status | Requested |
|---------|------|--------|-----------|
| 1 | USB-C Charger | ✅ Approved | 2 days ago |
| 2 | Office Chair | ⏳ Pending | 1 day ago |
| 3 | Garden Tractor | ✅ Approved | 6 hours ago |

### Data Structure

**Items** are stored in: `heyneighbor:items`
```typescript
interface Item {
  item_id: number;
  name: string;
  category: string;
  owner_id: number;
  request_status: "borrowed" | "available" | "pending";
}
```

**Borrow Requests** are stored in: `heyneighbor:borrow-requests`
```typescript
interface BorrowRequest {
  request_id: number;
  user_id: number;      // Who is borrowing
  item_id: number;      // What item
  request_datetime: number;
  status: "pending" | "approved" | "rejected";
}
```

### New Functions Available

- `getAllItems()` - Get all items
- `getItemById(itemId)` - Get specific item
- `getAllBorrowRequests()` - Get all borrow requests
- `getBorrowRequestsByUserId(userId)` - Get requests made by a user
- `getBorrowRequestById(requestId)` - Get specific request

### Testing

When the app starts with DATABASE_MODE = 'mock':
1. Bryn can log in with email `bryn@example.com`
2. Once logged in, user_id will be 3
3. Can query items and borrow requests for Bryn
4. Two random owners (Charlie & Dana) own the items
