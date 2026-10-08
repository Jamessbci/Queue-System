# QueueFlow

Queue management app built with React, Vite, and an Express API. Queue state is stored by the backend in `data/queue-state.json` and shared across connected browsers.

## Run locally

```sh
npm install
npm run dev
```

This starts the API on `http://localhost:3001` and the Vite app on `http://localhost:5173`. Vite proxies `/api` requests to the API server. Set `PORT` to change the API port or `QUEUE_API_TARGET` to point Vite at another API URL.

## Project structure

```text
src/
	App.jsx                     App state and route composition
	features/
		auth/AuthScreens.jsx       Login, setup, and account management
		navigation/Navbar.jsx      Shared application navigation
		queue/
			Dashboard.jsx            Staff queue management
			PublicPages.jsx           Home, ticket kiosk, and monitor display
			services.js               Queue service definitions
	shared/api.js                Shared HTTP API client
server.js                      Express setup and route mounting
server/
	authRoutes.js                Login, sessions, and account routes
	queueRoutes.js               Queue and monitor routes
	storage.js                   JSON files and signing-key storage
```

## Accounts

On first launch, create the superadmin account in the setup screen. Use a password of at least 12 characters. Sign in, open **Accounts**, and create admin and staff accounts with individual passwords.

- **Superadmin:** queue management, account management, and full queue reset.
- **Admin:** queue management and ticket cancellation.
- **Staff:** issue and serve tickets; cannot cancel tickets or reset the queue.
- The public home, ticket kiosk, and queue display do not require sign-in.

Passwords are stored as bcrypt hashes. Account records and the signing key are kept under `data/`, which is ignored by Git. Back up that directory to retain accounts and queue records.

## API

- `GET /api/state` returns private queue and counter state to signed-in users.
- `GET /api/display` returns customer-name-free public queue state.
- `POST /api/public/queues` issues a public walk-in ticket.
- `GET /api/auth/status` checks setup and current login status.
- `POST /api/auth/setup` creates the first superadmin account.
- `POST /api/auth/login` and `POST /api/auth/logout` manage sign-in.
- `GET /api/auth/users`, `POST /api/auth/users`, and `DELETE /api/auth/users/:id` are superadmin-only account management routes.
- `POST /api/queues` with `{ "serviceCode": "REG" }` issues a queue ticket.
- `POST /api/call-next` with `{ "counter": 1 }` calls the next waiting ticket.
- `POST /api/complete` completes the active ticket.
- `POST /api/skip` skips the active ticket.
- `POST /api/reset` clears all queue state.
