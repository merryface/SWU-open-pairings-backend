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
3. Run `npm start` or `npm run dev`.
4. Run tests with `npm test`.

## Environment Variables
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `JWT_EXPIRES_IN`

## Notes
- Public routes will expose published pairings only.
- Admin routes require JWT authentication.
- Database persistence is provided by SQLite.
