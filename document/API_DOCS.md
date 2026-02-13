# Backend API Documentation

Base URL: `http://localhost:5000/api` (Development)

## 🔐 Authentication

### Register
Create a new user account.
- **URL**: `/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_here",
    "user": { ... }
  }
  ```

### Login
Authenticate an existing user.
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_here",
    "user": { ... }
  }
  ```

### Get Current User
Get details of the currently logged-in user.
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (User object)

---

## 🎫 Tickets
*All endpoints require `Authorization: Bearer <token>`*

### Create Ticket
Create a new support ticket.
- **URL**: `/tickets`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `title`: String
  - `description`: String
  - `attachments`: File[] (Optional)
- **Response**: `201 Created`

### Get Tickets
Fetch all tickets. Supports filtering.
- **URL**: `/tickets`
- **Method**: `GET`
- **Query Params**:
  - `status`: 'open' | 'in-progress' | 'resolved'
  - `search`: String (searches title/description)
- **Response**: `200 OK` (Array of filters tickets)

### Redeem Ticket
Assign a ticket to yourself (Solver).
- **URL**: `/tickets/:id/redeem`
- **Method**: `PATCH`
- **Response**: `200 OK`

### Resolve Ticket (New Solution)
Submit a new solution for a ticket.
- **URL**: `/tickets/:id/resolve`
- **Method**: `PATCH`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `content`: String (Solution description)
  - `attachments`: File[] (Optional)
- **Response**: `200 OK`

### Resolve with Existing Solution
Link an existing solution (Knowledge Base) to a ticket.
- **URL**: `/tickets/:id/resolve-with-existing`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "solutionId": "uuid_of_existing_solution"
  }
  ```
- **Response**: `200 OK`

### Delete Ticket
Delete a ticket (Soft delete).
- **URL**: `/tickets/:id`
- **Method**: `DELETE`
- **Response**: `200 OK`

---

## 💡 Solutions (Knowledge Base)
*All endpoints require `Authorization: Bearer <token>`*

### Search Solutions
Find reuseable solutions.
- **URL**: `/solutions/search`
- **Method**: `GET`
- **Query Params**:
  - `q`: Search query string
- **Response**: `200 OK` (Array of approved solutions)

### Increment Reuse Count
Track that a solution was helpful.
- **URL**: `/solutions/:id/reuse`
- **Method**: `PATCH`
- **Response**: `200 OK`

---

## 🛡️ Admin
*All endpoints require `Authorization: Bearer <token>` AND user role `admin`*

### Get Pending Solutions
List solutions waiting for approval.
- **URL**: `/admin/solutions/p### User Profile Management

-   **Get My Profile**
    -   `GET /auth/me`
    -   Response: `200 OK`

### Approve Solution
Approve a solution, resolve the ticket, and award credits.
- **URL**: `/admin/solutions/:id/approve`
- **Method**: `PATCH`
- **Response**: `200 OK`

### Reject Solution
Reject a solution and reopen the ticket.
- **URL**: `/admin/solutions/:id/reject`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "reason": "Explanation for rejection"
  }
  ```
- **Response**: `200 OK`

### Disable Solution
Remove a solution from the Knowledge Base.
- **URL**: `/admin/solutions/:id/disable`
- **Method**: `PATCH`
- **Response**: `200 OK`

### Get User Stats
Get overview of users and credits.
- **URL**: `/admin/users/stats`
- **Method**: `GET`
- **Response**: `200 OK`

### Manage Users
- **List Users**: `GET /admin/users`
- **Delete User**: `DELETE /admin/users/:id`

---

## 🔔 Notifications
*All endpoints require `Authorization: Bearer <token>`*

### Register Device Token
Register a device for Push Notifications.
- **URL**: `/notifications/register-token`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "token": "ExpoPushToken[...]"
  }
  ```
- **Response**: `200 OK`

### Get Notifications
List user's notifications.
- **URL**: `/notifications`
- **Method**: `GET`
- **Response**: `200 OK`

### Mark as Read
- **URL**: `/notifications/:id/read`
- **Method**: `PUT`
- **Response**: `200 OK`

### Delete Notification
- **URL**: `/notifications/:id`
- **Method**: `DELETE`
- **Response**: `200 OK`

---

## 👤 User Profile
*All endpoints require `Authorization: Bearer <token>`*

### Upload Avatar
Update profile picture.
- **URL**: `/users/avatar`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `avatar`: File (Image)
- **Response**: `200 OK`

### Remove Avatar
Delete profile picture.
- **URL**: `/users/avatar`
- **Method**: `DELETE`
- **Response**: `200 OK`

---

## 💰 Credits & Rewards
*All-   **Amount**: Integer (e.g., 10, 20)
-   **Code**: String (e.g., "ABCD-1234")

#### 1. Get My Coupons
Fetch all coupons earned by the user.
- **URL**: `/credits/coupons`
- **Method**: `GET`
-   Returns: `200 OK` with `coupons: Coupon[]`.

#### 2. Convert Credits to Coupon
Redeem 50 credits for a ₹10 coupon.
- **URL**: `/credits/convert`
- **Method**: `POST`
- **Response**: `200 OK`
  ```json
  {
    "message": "Successfully converted 50 credits to a ₹10 coupon!",
    "coupon": { ... },
    "totalCredits": 450
  }
  ```
