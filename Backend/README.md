# Adornment Backend

Node.js/Express + MongoDB (Mongoose) backend for the Next.js marketplace in
`../app`.

## Stack

- **Express** — HTTP layer
- **MongoDB / Mongoose** — data store and ODM
- **JWT** (access + rotating refresh tokens, hashed at rest) — auth for both
  staff (admin dashboard) and customers (storefront)
- **Zod** — request validation
- **Multer** — file uploads (product images, try-on photos, avatars)
- **Helmet, CORS, HPP, rate limiting** — baseline hardening
- **Pino** — structured logging
- **Jest + Supertest + mongodb-memory-server** — tests with no external DB needed

## Getting started

```bash
cp .env.example .env      # set local database URL and generate unique secrets
npm install
npm run seed               # creates categories + an OWNER staff account
npm run dev                 # http://localhost:4000
```

Set `OWNER_EMAIL` and `OWNER_PASSWORD` (optionally `OWNER_NAME`) before
running `npm run seed` to provision the first owner. Choose a unique password
of at least 12 characters. The seed command never creates a known default
account. Staff creation requires an authenticated OWNER account.

Or with Docker:

```bash
docker compose up --build
```

Compose is for local development and uses its MongoDB service. For hosting,
use a managed MongoDB replica set, set `NODE_ENV=production`, provide unique
random JWT and cookie secrets of at least 32 characters, and set
`CLIENT_ORIGIN` to the exact HTTPS storefront and admin origins. Never copy
`.env` into an image or commit it; the Docker build excludes local secrets.

## Project layout

```
src/
  app.js              Express app: middleware, routes, error handling
  server.js           Entry point: connects to Mongo, starts listening
  seed.js             Seeds categories + an owner account
  config/             env, logger, db connection
  middleware/         auth, validate, upload, rateLimit, errorHandler
  models/             Mongoose schemas (Staff, Customer, Product, Order, ...)
  modules/
    auth/             staff + customer register/login/refresh/logout
    products/         catalog CRUD, categories, image upload
    inventory/        restock/adjust stock, movement audit log, low-stock report
    orders/           cart, checkout, sales/order management (sales.html)
    aiStudio/         AI try-on job pipeline (AI.html), pluggable provider
    users/            account settings: profile, bank connect, password, addresses
    dashboard/        aggregated stats for dashboard.html
  routes/index.js     mounts all module routers under /api
  utils/              ApiError, asyncHandler, jwt, password hashing, id/codes
```

## Data model

Rather than a relational join-heavy schema, the Mongo model embeds what's
always read together:

- **Product** embeds its `images[]` and `variants[]` (size/color/stock).
  Each variant subdocument has its own `_id`, so carts, orders, and
  inventory movements can reference a specific variant directly.
- **Order** embeds a point-in-time snapshot of its `items[]` (name, price at
  purchase) and its `payment`, so later edits to a product never rewrite
  order history.
- **Staff** embeds its own `bankAccount` (a tokenized provider reference —
  never a raw account number).
- **Customer** embeds its `addresses[]`.
- **InventoryMovement**, **AiTryOnJob**, **RefreshToken**, **Category**, and
  **Cart** are separate top-level collections.

See `src/models/*.js` for the full schemas and comments.

## Auth model

Two independent identities share one JWT/refresh-token scheme:

- **Staff** — `role`: `OWNER` / `ADMIN` / `SELLER`, used by the admin
  dashboard (`Home-Admin.html`, `dashboard.html`, `Inventory.html`,
  `sales.html`, `account-settings.html`, `AI.html`).
- **Customer** — used by the storefront (`login.html`, `clothe-home.html`,
  category pages, `AI.html`).

`POST /api/auth/{staff,customer}/login` returns a short-lived **access
token** in the JSON body (the current static clients keep it in local storage) and sets a
long-lived **refresh token** as an `httpOnly` cookie scoped to `/api/auth`.
`POST /api/auth/refresh` rotates it (old token is revoked, a new one
issued) — refresh-token reuse is therefore detectable. Send the access
token as `Authorization: Bearer <token>` on every other request.

## API summary

All routes are mounted under `/api`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/staff/register` (OWNER only), `/auth/staff/login`, `/auth/customer/register`, `/auth/customer/login`, `/auth/refresh`, `/auth/logout` |
| Products | `GET /products`, `GET /products/:id`, `POST /products` (staff), `PATCH /products/:id` (staff), `DELETE /products/:id` (staff), `POST /products/:id/images` (staff), `GET/POST /products/categories` |
| Inventory | `POST /inventory/restock`, `POST /inventory/adjust`, `GET /inventory/movements`, `GET /inventory/low-stock` — all staff-only |
| Cart & Orders | `GET/POST /orders/cart`, `PATCH/DELETE /orders/cart/items/:variantId`, `POST /orders/checkout`, `GET /orders/mine` (customer); `GET /orders` (staff, sales.html), `PATCH /orders/:id/fulfill`, `PATCH /orders/:id/status`, `GET /orders/:id` (shared) |
| AI Try-On Studio | `POST /ai-studio/jobs` (multipart: `photo` + pose/lighting/environment), `GET /ai-studio/jobs`, `GET /ai-studio/jobs/:id` |
| Account settings | `GET /users/me`, `PATCH /users/staff/me`, `POST /users/staff/me/bank-account`, `POST /users/staff/me/password`, `POST /users/staff/me/avatar`, `POST /users/customer/me/addresses`, `POST /users/customer/me/password` |
| Dashboard | `GET /dashboard/overview` (staff) |
| Contact | `POST /contact` (public submission), `GET /contact`, `PATCH /contact/:id/status` (staff inbox) |
| Misc | `GET /health` |

Every list endpoint supports `page`/`pageSize`; every mutating endpoint
validates its body/params with Zod before touching the database.

## Running the frontend locally

From the project root, run `npm install` and `npm run dev` to start the
storefront and merchant workspace at `http://localhost:3000`. Next.js proxies
`/api` and `/uploads` to the backend at `http://localhost:4000`; change the
root `API_ORIGIN` setting if the backend runs elsewhere. Include
`http://localhost:3000` in `CLIENT_ORIGIN` for local browser access.

The seed creates the owner account and storefront categories. It does not add
sample products: create and publish products from the admin Inventory page
before they appear in storefront search and category browsing. Customer
checkout currently creates an unpaid `PENDING` order in development and does
not collect or verify payment. Checkout is disabled in production until a
provider and verified payment webhook have been implemented. Contact Us
submissions are validated and stored in the `ContactMessage` collection.

The Next.js customer and staff forms use the backend auth routes. The API
origin is configured on the Next.js server, so the browser can use the
same-origin refresh cookie.

## AI Try-On Studio provider

`src/modules/aiStudio/aiProvider.js` is an intentionally thin adapter over
whatever external image-generation/virtual-try-on API you choose. Until
`AI_PROVIDER_BASE_URL` / `AI_PROVIDER_API_KEY` are set in `.env`, it runs in
a stub mode (echoes the source photo back). Configure a real provider before
presenting AI try-on as a live feature.

## Notes on scaling this further

- **Transactions**: checkout inventory changes should use MongoDB multi-
  document transactions (which require a replica set) before handling live
  paid orders.
- **File storage**: uploads are on local disk under `uploads/`. Swap
  `middleware/upload.js`'s disk storage for an S3-compatible bucket before
  scaling past a single instance.
- **AI job processing**: jobs run "fire and forget" in-process. Swap
  `aiStudio.service.createJob`'s call to `processJob` for a real queue
  (BullMQ + Redis, SQS, etc.) once volume grows.
- **Payments**: the `Payment`/`bankAccount` fields expect a provider tokenized
  flow (Stripe Connect, Paystack). The backend never collects raw card or bank
  account numbers. Integrate and verify payment webhooks before accepting live
  orders. Move local disk uploads to object storage for multi-instance hosting.
