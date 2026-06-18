# SWU Open Pairings Backend

Backend service for SWU Open Pairings tournament management system.

## Tech Stack
- Node.js
- Express.js
- SQLite3
- JSON Web Tokens (JWT)
- bcryptjs
- Jest + Supertest

## Project Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── init.js
│   │   └── queries.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── pairings.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── pairings.test.js
│   └── setup.js
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Run `npm install`.
3. Run `npm start` to start the server.
4. Register merryface (super admin) with any username/password.
5. Use merryface to approve other admin registrations.
6. Run tests with `npm test`.

## Multi-Tier Admin System
The backend implements a multi-tier admin approval system:
- **merryface** - Super admin who can approve new admin registrations
- **Approved Admins** - Must be approved by merryface with a special_word before registration
- **Regular Users** - Cannot access admin endpoints

Registration Flow:
1. merryface registers and gains approval privileges
2. merryface approves new admins via POST /auth/admin/approve with a special_word
3. Approved admins register using their username, password, and special_word
4. Registered admins can create and manage tournament pairings

## Environment Variables
- `NODE_ENV` - development/production
- `PORT` - server port (default: 3000)
- `DATABASE_URL` - SQLite database path (default: ./pairings.db)
- `JWT_SECRET` - secret key for JWT signing (required)
- `JWT_EXPIRES_IN` - token expiration time (default: 1h)

## Notes
- Public routes expose only published pairings
- Admin routes require JWT authentication
- Admin registration requires approval from merryface
- Database uses SQLite for persistence
- See API.md for complete endpoint documentation
