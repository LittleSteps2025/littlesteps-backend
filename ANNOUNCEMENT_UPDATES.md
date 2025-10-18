# Announcement System Updates

## Changes Implemented

### 1. ✅ Published By Object
The `published_by` object is now returned with each announcement containing:
- `id` - The user's ID who created the announcement
- `name` - The user's name
- `role` - The user's role (Admin, Teacher, etc.)

**Implementation:**
- Modified `getAllAnnouncements()` in `announcementModel.js` to use `jsonb_build_object()` for the published_by object
- Modified `getAnnouncementById()` to include the same structure
- Joins with the `user` table to fetch author information

**Example Response:**
```json
{
  "ann_id": 1,
  "title": "Welcome Back!",
  "details": "...",
  "published_by": {
    "id": 14,
    "name": "John Doe",
    "role": "Admin"
  }
}
```

### 2. ✅ Null Values for Date and Time
Date and time fields now accept `null` values for general announcements that don't have specific event dates.

**Changes:**
- Updated `create` controller to accept `date: null` and `time: null`
- Updated `update` controller to accept `time: null` and `attachment: null`
- Removed automatic date/time generation when not provided

**Usage:**
- For general announcements: Don't send date/time or send as `null`
- For event announcements: Send specific date/time values

### 3. ✅ Automatic created_at Timestamp
The `created_at` timestamp is automatically set when creating new announcements.

**Implementation:**
- Database schema already includes `created_at TIMESTAMP DEFAULT NOW()`
- Query uses `NOW()` function when inserting: `created_at = NOW()`

### 4. ✅ Attachment Handling
Attachments are now properly handled and stored.

**Changes:**
- Controller accepts `attachment` field from request body
- Supports `null` values when no attachment is provided
- Stored as VARCHAR(255) in database

**Note:** Currently storing attachment as string (filename/URL). For file upload functionality, you'll need to:
1. Add `multer` middleware for file uploads
2. Configure file storage (local or cloud storage like AWS S3)
3. Update the attachment field to store the file URL/path

### 5. ✅ Authorization Headers
The API endpoints support authorization headers for user-specific information.

**Implementation:**
- Controllers check for `req.user` (from authentication middleware)
- Falls back to user_id 14 for development if no auth present
- Frontend sends: `Authorization: Bearer ${token}`

## API Endpoints

### GET /api/announcements
Fetch all announcements with published_by information

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": 200,
  "message": "Announcements fetched successfully",
  "data": [
    {
      "ann_id": 1,
      "title": "Important Notice",
      "details": "...",
      "date": null,
      "time": null,
      "audience": 1,
      "status": "published",
      "attachment": null,
      "created_at": "2025-10-17T10:30:00.000Z",
      "published_by": {
        "id": 14,
        "name": "Admin User",
        "role": "Admin"
      }
    }
  ]
}
```

### POST /api/announcements
Create a new announcement

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "New Announcement",
  "details": "Announcement details here",
  "audience": 1,
  "status": "published",
  "date": null,
  "time": null,
  "attachment": null
}
```

### PUT /api/announcements/:ann_id
Update an announcement

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Title",
  "details": "Updated details",
  "audience": 2,
  "status": "published",
  "time": null,
  "attachment": null
}
```

### GET /api/announcements/:ann_id
Get a specific announcement

**Headers:**
```
Authorization: Bearer <token>
```

### DELETE /api/announcements/:ann_id
Delete an announcement

**Headers:**
```
Authorization: Bearer <token>
```

## Audience Values
- `1` = All (Supervisors, Teachers, and Parents)
- `2` = Teachers only
- `3` = Parents only
- `4` = Supervisors & Teachers
- `5` = Teachers & Parents

## Database Schema

```sql
CREATE TABLE announcement (
  ann_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  audience INTEGER NOT NULL,
  user_id INTEGER REFERENCES "user"(user_id),
  session_id INTEGER,
  date DATE,
  time TIME,
  attachment VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Frontend Integration

The frontend already includes:
- Authorization headers in all API calls
- Proper handling of `published_by` object
- Support for null date/time values
- Display of created_at timestamp
- Attachment link display (when available)

## Testing

Test the endpoints using:
```bash
node testAdminPayments.js
```

Or use Postman/curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/announcements
```

## Notes

1. **File Uploads:** To enable actual file uploads for attachments, install and configure multer:
   ```bash
   npm install multer
   ```

2. **Authentication:** Make sure Firebase authentication middleware is properly configured to populate `req.user`

3. **User Table:** Ensure the `user` table has a `role` column for the published_by object

4. **Session ID:** The session_id field is optional and can remain null if not used
