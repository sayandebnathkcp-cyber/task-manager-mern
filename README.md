# TaskFlow — Full-Stack MERN Task Manager

TaskFlow is a production-ready full-stack task manager built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). Users can register, log in securely using JWT authentication, and manage their personal workspace with advanced task tracking, real-time statistics, search, sorting, and bulk operations.

---

## 🚀 Key Features

- **Authentication & Authorization**:
  - Secure user registration & login with password hashing (`bcryptjs`) and JWT authentication.
  - User logout (client-side token removal).
  - Protected API routes requiring `Authorization: Bearer <token>`.
  - Strict user data isolation (users can only access, modify, or delete their own tasks).

- **Task Management (CRUD)**:
  - **Create**: Add tasks with Title (required), Description, Status (`pending`, `in-progress`, `completed`), Priority (`low`, `medium`, `high`), and Due Date.
  - **Read**: Fetch all user tasks or fetch a single task by ID.
  - **Update**: Edit task details or toggle completion/status.
  - **Delete**: Delete single task or **bulk delete all completed tasks** ("Clear Completed").

- **Filtering, Searching & Sorting**:
  - **Filter**: All, Pending, In Progress, Completed, or Overdue.
  - **Real-Time Search**: Search tasks by title or description keywords.
  - **Sorting**: Sort by Newest First, Oldest First, Priority (High to Low), or Due Date (Earliest).

- **Real-Time Statistics Dashboard**:
  - Displays statistics for Total Tasks, Pending Tasks, In Progress Tasks, Completed Tasks, and **Overdue Tasks** (tasks past due date that are incomplete).

- **Modern & Responsive UI**:
  - Built with React, Vite, and custom CSS design system.
  - Interactive modals, priority indicators, and glassmorphism styling.
  - **Toast Notification System** for visual user feedback on actions.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, React Router DOM, Axios, Custom CSS Design System
- **Backend**: Node.js, Express.js, Mongoose, MongoDB
- **Security & Utilities**: JSON Web Token (jsonwebtoken), bcryptjs, CORS, dotenv

---

## 📦 Setup & Installation

1. **Configure Server Environment**:
   ```sh
   cp server/.env.example server/.env
   ```

2. **Install Server Dependencies**:
   ```sh
   cd server
   npm ci
   ```

3. **Install Client Dependencies**:
   ```sh
   cd client
   npm ci
   ```

4. **Optionally Configure Client Environment**:
   ```sh
   cp client/.env.example client/.env
   ```

---

## 💻 Development & Running Locally

1. **Start Backend API** (Terminal 1):
   ```sh
   cd server
   npm run dev
   ```

2. **Start Frontend Client** (Terminal 2):
   ```sh
   cd client
   npm run dev
   ```

Default Local Endpoints:
- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001/api`

---

## 📡 API Documentation

### Authentication Routes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`name`, `email`, `password`) | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| `GET` | `/api/auth/profile` | Get logged-in user profile | Private |

### Task Routes
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tasks` | Fetch tasks (`?search=kw&sortBy=newest\|oldest\|priority\|dueDate`) | Private |
| `POST` | `/api/tasks` | Create a new task | Private |
| `GET` | `/api/tasks/:id` | Fetch single task by ID | Private |
| `PUT` | `/api/tasks/:id` | Update task details | Private |
| `DELETE` | `/api/tasks/:id` | Delete a single task | Private |
| `DELETE` | `/api/tasks/completed` | Bulk delete all completed tasks | Private |

---

## 🧪 Verification & Automated Tests

Run backend tests:
```sh
node --test server/tests/*.test.js
```

Build production client bundle:
```sh
cd client && npm run build
```
