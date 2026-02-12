# Backend API - Complete Documentation

This document provides a detailed, file-by-file explanation of the Backend API.

## ✅ Root Directory

### Configuration Files
-   **`.env`**: Stores sensitive secrets like `DB_PASSWORD` and `JWT_SECRET`.
-   **`.env.development`**: Environment variables used when running `npm run dev`.
-   **`.env.production`**: Environment variables used when running `npm start` (for deployment).
-   **`.sequelizerc`**: Tells Sequelize CLI where to find the `models` folder and `migrations` folder.
-   **`.gitignore`**: Lists files that Git should ignore (like `node_modules` or `.env`).
-   **`package.json`**: The project manifest. Lists all installed libraries (`dependencies`) and runnable commands (`scripts`).
-   **`tsconfig.json`**: TypeScript configuration. Defines how code is compiled to JavaScript.

### Folders
-   **`src/`**: The main source code.
-   **`uploads/`**: Stores user-uploaded files like avatars and ticket attachments.
-   **`dist/`**: (Generated on build) Contains the compiled JavaScript code ready for production.

---

## ✅ `src/` Directory (Source Code)

### Main Entry Files
-   **`server.ts`**: The application entry point.
    -   Loads `.env` variables.
    -   Connects to the Database.
    -   Starts the HTTP Server (Express).
    -   Initializes the Socket.io server.
-   **`app.ts`**: Express App Configuration.
    -   Sets up Middleware (CORS, Body Parser).
    -   Registers all API Routes (`/auth`, `/tickets`, etc.).
    -   Defines the Global Error Handler.

### 📂 `src/config/` (Settings)
-   **`database.ts`**: Configures the connection to PostgreSQL using Sequelize.
-   **`firebase.ts`**: Initializes Firebase Admin SDK for sending Push Notifications.
-   **`config.ts`**: (Optional) Centralized config object for the app.

### 📂 `src/models/` (Database Schema)
Defines the structure of the database tables.
-   **`User.ts`**:
    -   Columns: `id`, `name`, `email`, `password`, `role` (admin/trainee), `credits`.
    -   Logic: Has method to validate passwords.
-   **`Ticket.ts`**:
    -   Columns: `id`, `title`, `description`, `status`, `traineeId`, `redeemedBy`.
    -   Logic: Links a ticket to its Creator and its Solver.
-   **`Solution.ts`**:
    -   Columns: `id`, `ticketId`, `solverId`, `content`, `status` (pending/approved/declined).
    -   Logic: Stores the proposed solution for a ticket.
-   **`Notification.ts`**:
    -   Columns: `id`, `userId`, `title`, `message`, `read`.
    -   Logic: Stores alerts for users.
-   **`DeviceToken.ts`**:
    -   Columns: `id`, `userId`, `token`.
    -   Logic: Stores Expo Push Tokens for sending notifications to phones.
-   **`index.ts`**: Initializes associations (e.g., "User has many Tickets").

### 📂 `src/controllers/` (Business Logic)
Handles incoming requests and returns responses.
-   **`auth.controller.ts`**: Handles Login (`login`), Registration (`register`), and Profile updates.
-   **`ticket.controller.ts`**:
    -   `createTicket`: Creates a new ticket.
    -   `getTickets`: Fetches tickets (with optional filters).
    -   `redeemTicket`: Assigns a ticket to a user.
-   **`solution.controller.ts`**:
    -   `submitSolution`: Saves a user's solution.
    -   `approveSolution`: Admin approves a solution (credits user, resolves ticket).
    -   `rejectSolution`: Admin rejects a solution (reopens ticket).
-   **`notification.controller.ts`**: Fetches user notifications.
-   **`admin.controller.ts`**: Admin-specific actions (e.g., viewing pending approvals).

### 📂 `src/routes/` (API Endpoints)
Maps URLs to Controllers.
-   **`auth.routes.ts`**: `POST /auth/login`, `POST /auth/register`.
-   **`ticket.routes.ts`**:
    -   `POST /tickets` -> `createTicket`
    -   `PUT /tickets/:id/redeem` -> `redeemTicket`
-   **`solution.routes.ts`**: `POST /solutions`, `PUT /solutions/:id/approve`.
-   **`notification.routes.ts`**: `GET /notifications`.
-   **`admin.routes.ts`**: Routes for admin dashboard (e.g., `GET /admin/stats`).

### 📂 `src/middleware/` (Request Processing)
Runs before the controller.
-   **`auth.middleware.ts`**: Verifies the JWT token. If invalid, blocks the request.
-   **`admin.middleware.ts`**: Verifies the user has `role: 'admin'`.
-   **`upload.middleware.ts`**: Configures Multer to handle file uploads.

### 📂 `src/services/` (Helper Functions)
-   **`socket.service.ts`**: Manages real-time WebSocket events.
    -   `emit('ticket_created')`: Tells clients a new ticket exists.
-   **`notification.service.ts`**: Sends Push Notifications via Firebase.
-   **`credit.service.ts`**: Logic for calculating and adding credits to users.

### 📂 `src/migrations/` (Database Changes)
Files here describe changes to the database structure over time (e.g., "Create Users Table", "Add Avatar Column").

### 📂 `src/scripts/` (Utilities)
Standalone scripts for maintenance or testing.
-   **`check-notifications.ts`**: Debug script to test notification sending.
-   **`verify-models.ts`**: Checks if DB tables match the Models.
-   **`resync-credits.ts`**: Recalculates user credits based on approved solutions.
