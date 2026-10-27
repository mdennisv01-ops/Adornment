# Adornment Marketplace

Adornment is an independent fashion marketplace with a Next.js storefront and
merchant workspace, backed by the existing Express/MongoDB API in `Backend`.
The original static storefront and admin files remain in `client/MAIN` and
`client/ADMIN` as source material; the active web application is at the repo
root in `app/`.

## Run the application

Use Node.js 18 or newer. In the repository root, install dependencies and run
the Next.js app:

```sh
npm install
npm run dev
```

The storefront opens at `http://localhost:3000`; the merchant workspace is at
`http://localhost:3000/admin`. Start the API separately using the setup steps
in [`Backend/README.md`](Backend/README.md). The Next.js server proxies `/api`
and `/uploads` to `API_ORIGIN`, which defaults to `http://localhost:4500`.
For a different API host, set `API_ORIGIN` in the Next.js environment. Add the
Next.js origin to `CLIENT_ORIGIN` in `Backend/.env` when developing locally.

The new storefront pages include home, shop and category filters, product
details, cart, customer registration/sign-in, checkout, and order history. The
shop and featured products read published inventory from the API; curated
sample cards appear when the API has no products or cannot be reached. The
merchant workspace can add products and variants, upload product images,
restock, and fulfill orders. Checkout requires a customer account, live product
variants, and a configured payment provider before production launch.

## Hosting layout

Deploy the Next.js app as a Node service and deploy `Backend` as a separate
Node service. Set `API_ORIGIN` on Next.js to the backend origin and include the
Next.js HTTPS origin in the API's `CLIENT_ORIGIN`. The Next.js server proxies
`/api` and `/uploads` so browser requests and refresh cookies use one origin.
If you host the storefront and API on separate browser origins without that
proxy, set `COOKIE_SAME_SITE=none` and use HTTPS.

The API requires `NODE_ENV=production`, `MONGODB_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, and `COOKIE_SECRET`. Use a MongoDB replica set and three
different randomly generated secrets of at least 32 characters. `PORT` is
provided by most hosting platforms. Keep secrets in the host's secret manager;
never put them in the static site or a checked-in file. See
[`Backend/.env.example`](Backend/.env.example) for all API settings.

Provision the owner once by running `npm run seed` in `Backend` with
`OWNER_EMAIL` and a unique `OWNER_PASSWORD` (at least 12 characters) set in the
environment. Set `OWNER_NAME` optionally. The seed creates categories and the
owner. Create real products, images, prices, and stock in the admin catalogue
before launch. If an older database was seeded with a default owner account,
replace its password before exposing the admin site.

For local first-login setup only, you may set `OWNER_USERNAME=Admin`,
`OWNER_NAME=Admin`, `OWNER_FORCE_PASSWORD_RESET=true`, and a temporary
`OWNER_PASSWORD` of at least five characters before seeding. The temporary
password flow is disabled in production; production owners must start with a
unique password of at least 12 characters. Staff must replace a temporary
password before accessing admin features.

## Before accepting real orders

- Integrate a payment provider and verify its signed payment webhooks. API
  checkout is deliberately disabled in production until then; local checkout
  only creates unpaid pending orders.
- Configure a real AI try-on provider, or hide that feature. Without provider
  credentials it returns the uploaded source photo as a stub result.
- Use durable object storage for uploaded media before using multiple API
  instances. The current upload directory is local disk.
- Configure backups and monitoring for the database and uploaded media.
- Confirm product copy, pricing, currencies, shipping, returns, and privacy
  content with the business. Live product availability is managed through the
  API; curated examples display only while the API catalogue is empty or offline.

For local development, follow [`Backend/README.md`](Backend/README.md).
