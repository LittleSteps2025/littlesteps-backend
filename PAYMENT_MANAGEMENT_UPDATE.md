# Payment Management API - Complete Update

## Summary of Changes

### 1. ✅ Enhanced Data Structure
The API now returns comprehensive payment data including:
- Payment ID, Order ID, Amount, Status
- Parent information (ID, Email, Name)
- Child information (ID, Name)
- Payment method and transaction reference
- Timestamps and additional metadata

### 2. ✅ Parent and Child Names
- Joins with `user` table to get parent name by email
- Joins with `child` table to get child name by child_id
- Returns null-safe values (N/A if not found)

### 3. ✅ Payment Status Mapping
- Database `status` field: 'pending', 'completed', 'failed'
- API returns: 'paid' or 'unpaid'
- Logic: `completed` OR `paid_at IS NOT NULL` = 'paid', else 'unpaid'

### 4. ✅ Proper Field Mapping
- `parent_email` → `parent_id` (for frontend compatibility)
- Database `status` → `method` (payment method display)
- Calculated `status` field for paid/unpaid

## API Response Format

```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [
    {
      "payment_id": "1",
      "order_id": "ORDER_1756407902543",
      "amount": 5000.00,
      "status": "unpaid",
      "parent_id": "lakshan2020kavindu@gmail.com",
      "parent_name": "Lakshan Kavindu",
      "child_id": "2",
      "child_name": "John Doe Jr.",
      "method": "pending",
      "transaction_ref": "ORDER_1756407902543",
      "created_at": "2025-08-28T19:05:03.083866Z",
      "currency": "LKR",
      "paid_at": null,
      "package_id": "",
      "month": "",
      "notes": ""
    }
  ]
}
```

## Database Joins

The query now performs LEFT JOINs with:
1. **user table** - To get parent name from email
2. **child table** - To get child name from child_id

```sql
SELECT 
  p.id as payment_id,
  p.order_id,
  p.child_id,
  p.parent_email as parent_id,
  p.amount,
  p.currency,
  p.status as method,
  p.created_at,
  p.paid_at,
  '' as package_id,
  '' as month,
  p.order_id as transaction_ref,
  '' as notes,
  CASE 
    WHEN p.status = 'completed' OR p.paid_at IS NOT NULL THEN 'paid'
    ELSE 'unpaid'
  END as status,
  parent.name as parent_name,
  child.name as child_name
FROM payments p
LEFT JOIN "user" parent ON p.parent_email = parent.email
LEFT JOIN child ON p.child_id = child.child_id
WHERE 1=1
ORDER BY p.created_at DESC
```

## Frontend Features Enabled

### 1. **Statistics Display**
The frontend now correctly calculates:
- Total number of payments
- Number of paid payments
- Number of unpaid payments
- Total amount across all payments

### 2. **Status Filter**
- Filter by: All, Paid, Unpaid
- Uses the calculated `status` field
- Updates count dynamically

### 3. **Search Functionality**
Search works across multiple fields:
- Order ID
- Transaction Reference
- Parent ID (email)
- Parent Name
- Child ID
- Child Name
- Payment Method

### 4. **Payment Method Filter**
- Filters by the `method` field (status from DB)
- Shows unique methods from all payments
- Dynamic dropdown based on available data

### 5. **Enhanced Display**
Each payment row shows:
- Status badge (✓ Paid / ✗ Unpaid) with color coding
- Parent name with ID below
- Child name with ID below
- Formatted currency
- Formatted date/time

## Testing the API

### Get All Payments
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/admin/payments
```

### Get Payment by ID
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/admin/payments/1
```

### With Filters
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5001/api/admin/payments?status=completed&startDate=2025-08-01"
```

## Available Filters

Query Parameters:
- `startDate` - Filter payments from this date
- `endDate` - Filter payments until this date
- `status` - Filter by DB status (pending, completed, failed)
- `parent_email` - Filter by parent email
- `child_id` - Filter by child ID
- `order_id` - Filter by order ID

## Frontend Integration

The frontend now properly:
1. ✅ Displays parent and child names
2. ✅ Shows paid/unpaid status with badges
3. ✅ Calculates totals correctly
4. ✅ Filters work for status and method
5. ✅ Search works across all text fields
6. ✅ Handles null values gracefully (shows "N/A")

## Database Requirements

Make sure these tables exist with proper relationships:

### User Table
```sql
CREATE TABLE "user" (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50)
);
```

### Child Table
```sql
CREATE TABLE child (
  child_id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255),
  child_id INTEGER REFERENCES child(child_id),
  parent_email VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

## Known Data

Based on your database:
- Parent email: `lakshan2020kavindu@gmail.com`
- Child ID: `2`
- Payments are currently showing `status: 'pending'`

The API will:
1. Find parent name from user table using email
2. Find child name from child table using child_id
3. Return 'unpaid' for status since status='pending' and paid_at is null

## Troubleshooting

### If parent_name shows null:
Check if user exists with that email:
```sql
SELECT * FROM "user" WHERE email = 'lakshan2020kavindu@gmail.com';
```

### If child_name shows null:
Check if child exists with that ID:
```sql
SELECT * FROM child WHERE child_id = 2;
```

### If search returns blank:
- Check browser console for errors
- Verify the search term matches data
- Make sure data is loaded (check Network tab)
- Verify filtering logic in frontend

## Next Steps

1. Ensure user table has parent records with names
2. Ensure child table has child records with names
3. Test the search functionality with actual data
4. Verify filters work with your data set
5. Check that totals calculate correctly
