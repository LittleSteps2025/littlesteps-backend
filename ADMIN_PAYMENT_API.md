# Admin Payment Management API Documentation

## Overview
Separate admin-specific payment management endpoints for viewing and managing all payments in the system.

## Files Created/Modified

### Models
- **`src/models/payment/adminPaymentModel.js`** - Admin-specific payment queries

### Controllers
- **`src/controllers/payment/adminPaymentController.js`** - Admin payment business logic

### Routes
- **`src/routes/payment/adminPaymentRoute.js`** - Admin payment endpoints

## API Endpoints

### Base URL: `/api/admin/payments`

#### 1. Get All Payments
```
GET /api/admin/payments
```

**Query Parameters:**
- `startDate` - Filter by start date (optional)
- `endDate` - Filter by end date (optional)
- `status` - Filter by status: pending, completed, failed (optional)
- `parent_email` - Filter by parent email (optional)
- `child_id` - Filter by child ID (optional)
- `order_id` - Filter by order ID (optional)

**Response:**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [
    {
      "payment_id": 1,
      "order_id": "ORDER_1756407902543",
      "child_id": 2,
      "parent_id": "lakshan2020kavindu@gmail.com",
      "amount": "5000.00",
      "currency": "LKR",
      "method": "pending",
      "created_at": "2025-08-28T19:05:03.083866Z",
      "paid_at": null,
      "package_id": "",
      "month": "",
      "transaction_ref": "ORDER_1756407902543",
      "notes": ""
    }
  ]
}
```

#### 2. Get Payment by ID
```
GET /api/admin/payments/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Payment retrieved successfully",
  "data": {
    "payment_id": 1,
    "order_id": "ORDER_1756407902543",
    ...
  }
}
```

#### 3. Get Payment Statistics
```
GET /api/admin/payments/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "total_payments": "100",
    "total_amount": "500000.00",
    "completed_payments": "75",
    "pending_payments": "20",
    "failed_payments": "5"
  }
}
```

#### 4. Update Payment Status
```
PUT /api/admin/payments/:id/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Status Values:**
- `pending`
- `completed`
- `failed`

**Response:**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "id": 1,
    "order_id": "ORDER_1756407902543",
    "status": "completed",
    "paid_at": "2025-10-17T10:30:00Z",
    ...
  }
}
```

## Database Mapping

The admin model maps the actual database columns to frontend-expected field names:

| Database Column | API Response Field | Notes |
|----------------|-------------------|-------|
| `id` | `payment_id` | Primary key |
| `parent_email` | `parent_id` | For compatibility |
| `status` | `method` | Payment status |
| `order_id` | `transaction_ref` | Also used as reference |

## Frontend Integration

Update your frontend API endpoint from:
```typescript
const API_ENDPOINTS = {
  PAYMENTS: `${API_BASE_URL}/api/payment`,
}
```

To:
```typescript
const API_ENDPOINTS = {
  PAYMENTS: `${API_BASE_URL}/api/admin/payments`,
}
```

## Example Usage

### Fetch all payments:
```javascript
const response = await fetch('http://localhost:5001/api/admin/payments', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Filter by status:
```javascript
const response = await fetch('http://localhost:5001/api/admin/payments?status=completed', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Update payment status:
```javascript
const response = await fetch('http://localhost:5001/api/admin/payments/1/status', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ status: 'completed' })
});
```

## Regular Payment Routes

Regular (non-admin) payment routes remain at `/api/payment`:
- `POST /api/payment/notify`
- `POST /api/payment/create`
- `GET /api/payment/success`
- `GET /api/payment/cancel`
- `GET /api/payment/history/:child_id`
- `GET /api/payment/parent-history/:parent_email`
