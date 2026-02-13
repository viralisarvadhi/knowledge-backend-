# Backend Logical Workflows - Made Simple 🔄

This document explains the backend logic in two ways:
1.  **Simple Explanation**: Plain English summary of what's happening.
2.  **Deep Dive**: The exact technical steps, database queries, and checks.

---

## 1. Authentication Workflow 🔐

### Simple Explanation
**Registration**: When a new user signs up, we check if their email is new. We take their password and "scramble" it (hash it) so even we can't read it. Then we create their account and give them a digital "Key" (Token) to use the app.
**Login**: When a user logs in, we check if their password matches the scrambled one we saved. If it matches, we give them a new digital "Key" for the session.

### Deep Dive (Technical)

#### A. User Registration (`POST /auth/register`)
1.  **Receive Request**: Body contains `{ name, email, password }`.
2.  **Input Validation**: Check fields.
3.  **Database Check**: `SELECT * FROM Users WHERE email = input.email`. If found -> `400 Bad Request`.
4.  **Password Hashing**: `bcrypt.hash(password, 10)` -> Result: `$2b$10$...`.
5.  **Create User**: `INSERT INTO Users ...`. Default role: `'trainee'`, Credits: `0`.
6.  **Generate Token**: Sign JWT `{ id, role }`.
7.  **Response**: `201 Created` with Token.

#### B. User Login (`POST /auth/login`)
1.  **Receive Request**: Body contains `{ email, password }`.
2.  **Database Lookup**: Find user by email. If not found -> `401 Unauthorized`.
3.  **Password Verify**: `bcrypt.compare(input.password, hash)`. If false -> `401 Unauthorized`.
4.  **Generate Token**: Sign JWT.
5.  **Response**: `200 OK` with Token.

---

## 2. Protected Route Access 🛡️

### Simple Explanation
Some parts of the app (like creating tickets) are private. When a user tries to do these things, we check their digital "Key" (Token). If the key is valid, we let them in and know exactly who they are. If the key is fake or expired, we block them.

### Deep Dive (Technical)
1.  **Receive Request**: Check `Authorization: Bearer <token>`.
2.  **Verify Token**: `jwt.verify(token)`. If invalid -> `401 Unauthorized`.
3.  **Attach User**: `req.user = decoded_token`.
4.  **Proceed**: Call `next()`.

---

## 3. Ticket Lifecycle Workflow 🎫

### Simple Explanation
**Creating**: A Trainee posts a problem. We save it and instantly tell all Admins "Hey, new ticket!".
**Redeeming**: A Helper sees the ticket and clicks "I'll do it". We check if the ticket is free. If yes, we assign it to them so no one else takes it.
**Solving**: The Helper writes a solution. We save it as "Pending" and tell the Admins to review it.

### Deep Dive (Technical)

#### A. Creating a Ticket (`POST /tickets`)
1.  **Request**: Body `{ title, description }` + Files.
2.  **Database**: `INSERT INTO Tickets (..., status='open', traineeId=user.id)`.
3.  **Side Effect (Notify)**: Find all Admins -> Create Notification -> Send Push via Firebase.
4.  **Side Effect (Real-time)**: `socket.emit('ticket_created')` -> Updates UI.
5.  **Response**: `201 Created`.

#### B. Redeeming a Ticket (`PATCH /tickets/:id/redeem`)
1.  **Validate**: Is ticket `'open'`? Logic: User cannot redeem own ticket.
2.  **Database**: `UPDATE Tickets SET status='in-progress', redeemedBy=user.id`.
3.  **Socket**: `socket.emit('ticket_updated')`. Card turns Blue.
4.  **Response**: `200 OK`.

#### C. Submitting a Solution (`PATCH /tickets/:id/resolve`)
1.  **Validate**: Is `req.user.id == ticket.redeemedBy`?
2.  **Database**: `INSERT INTO Solutions (..., status='pending')`.
3.  **Notify**: Alert Admins "Solution Pending".
4.  **Response**: `200 OK`.

---

## 4. Admin Workflows 🏆

### Simple Explanation
**Approving**: The Admin acts as a judge. If a solution is good, they approve it. The ticket closes, and the Helper gets 10 points (Credits) as a reward.
**Rejecting**: If the solution is bad, the Admin rejects it. The ticket re-opens so someone else can try to solve it. The Helper gets 0 points.

### Deep Dive (Technical)

#### A. Approving (`PATCH /admin/solutions/:id/approve`)
1.  **Check Role**: Must be `'admin'`.
2.  **Transaction**:
    -   `UPDATE Solutions SET status='approved'`.
    -   `UPDATE Tickets SET status='resolved'`.
    -   `UPDATE Users SET credits = credits + 10 WHERE id=solverId`.
3.  **Notifications**: Tell Solver "You earned 10 credits!". Tell Creator "Fixed!".
4.  **Socket**: Update UI (Green card).

#### B. Rejecting (`PATCH /admin/solutions/:id/reject`)
1.  **Transaction**:
    -   `UPDATE Solutions SET status='rejected'`.
    -   `UPDATE Tickets SET status='reopened', redeemedBy=NULL`.
2.  **Notifications**: Tell Solver "Solution Rejected".
3.  **Socket**: Update UI (Orange card).

---

## 5. Rewards Workflow 💰

### Simple Explanation
**Conversion**: When a user earns enough credits (50), they can trade them for a real reward (₹10 Coupon). We deduct their points and give them a unique code they can use later.

### Deep Dive (Technical)
1.  **Request**: `POST /credits/convert`.
2.  **Validate**: Does `User.totalCredits >= 50`?
3.  **Transaction**:
    -   `UPDATE Users SET totalCredits = totalCredits - 50`.
    -   `INSERT INTO Coupons (code, amount=10, status='active', expiryDate=30_days_later)`.
4.  **Socket**: `socket.emit('credit_updated')` -> Updates UI balance.
5.  **Response**: `200 OK` with Coupon details.

---

## 6. Self-Solve Workflow 🛠️

### Simple Explanation
A Trainee can solve their own ticket. In this case, the system trusts them automatically. The ticket closes immediately, but they get 0 credits (since it's their own problem).

### Deep Dive (Technical)
1.  **Submit**: Trainee calls `/tickets/:id/resolve` on their own ticket.
2.  **Detection**: Backend checks if `ticket.traineeId == solution.createdBy`.
3.  **Auto-Process**:
    -   Sets Solution status to `'approved'`.
    -   Sets Ticket status to `'resolved'`.
    -   Awards **0** credits.
4.  **Response**: `200 OK` (Processed).
---

## 5. Notification Workflow 🔔

### Simple Explanation
**In-App**: When you are using the app, it listens for "whispers" (events) from the server. If a ticket changes, the screen updates automatically without you pulling down to refresh.
**Push Notifications**: When you close the app, we send a message to your phone (like Instagram or WhatsApp). We do this by looking up your phone's unique ID token.

### Deep Dive (Technical)

#### A. Registering Device
1.  **Request**: Frontend sends `ExpoPushToken`.
2.  **Database**: `UPSERT` into `DeviceTokens` table linked to User ID.

#### B. Sending Notification
1.  **Trigger**: Event happens (e.g., Ticket Solved).
2.  **Database**: `INSERT INTO Notifications`.
3.  **Firebase**: Look up User's `DeviceToken`. Call `admin.messaging().send()`.
4.  **Result**: Phone displays system notification.
