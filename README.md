# withinBlocks

**Run your business, block by block.**

A GST-compliant invoicing app for Indian small businesses — manage products, customers, and generate CGST/SGST/IGST-compliant tax invoices, with company branding (logo + signature) on every invoice.

## Tech stack

**Backend:** Node.js, Express 5, Prisma 7 (PostgreSQL), JWT auth, bcryptjs, Cloudinary (via `multer-storage-cloudinary`) for image uploads.

**Frontend:** React 19, Vite, Tailwind CSS v4, React Router v7, TanStack Query v5, Zustand (auth store), Axios, lucide-react.

## Project structure

```
WithinBlocks/
├── Backend/
│   ├── src/
│   │   ├── modules/          # auth, product, customer, invoice, upload, company
│   │   │   └── <name>/       #   each has .service.js, .controller.js, .routes.js
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── lib/               # Prisma client
│   │   ├── app.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── Frontend/
    └── src/
        ├── pages/             # one file per screen
        ├── components/        # pieces shared across 2+ pages
        ├── layouts/            # AppLayout (sidebar + outlet)
        ├── store/              # authStore (zustand)
        ├── services/           # axios instance (api.js)
        └── constants/          # e.g. indianStates.js
```

## Features

- **Auth** — email/password, JWT-based. A company and its owner account are created together at signup.
- **Multi-tenant** — every record (products, customers, invoices) is scoped to a `companyId`.
- **Products** — CRUD, image upload, HSN code, GST tax rate, inclusive/exclusive pricing.
- **Customers** — CRUD, GSTIN, state (used to determine CGST/SGST vs IGST).
- **Invoices**
  - Draft → Unpaid → Paid / Overdue / Cancelled lifecycle
  - Auto invoice numbering (`PREFIX-FY-counter`)
  - Real GST math: CGST+SGST for intra-state, IGST for inter-state, based on comparing `company.state` vs `customer.state`
  - Stock deduction/restoration tied to status transitions
  - Invoice detail page laid out like an actual Indian tax invoice (HSN, Qty, Rate, Total, Tax %, CGST, SGST, IGST, Taxable Value)
- **My Company settings** — business details (name, state, GSTIN, address, invoice prefix, financial year) plus logo/signature upload, shown on every invoice. Edited behind an explicit Edit/Save flow (not autosaved).

## Getting started

### Prerequisites

- Node.js 18+
- A PostgreSQL database
- A Cloudinary account (free tier is fine) — used for logo/signature/product image uploads

### 1. Clone & install

```bash
git clone https://github.com/PranavIIITN/WithinBlocks.git
cd WithinBlocks

cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Configure environment variables

Create `Backend/.env`:

```
DIRECT_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=some-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Run database migrations

```bash
cd Backend
npx prisma migrate dev
```

### 4. Run the app

```bash
# Terminal 1
cd Backend && npm run dev      # http://localhost:4000

# Terminal 2
cd Frontend && npm run dev     # http://localhost:5173
```

## API overview

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

| Module | Base path | Routes |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login` |
| Products | `/api/products` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Customers | `/api/customers` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Invoices | `/api/invoices` | `GET /`, `POST /`, `GET /:id`, `PUT /:id` (status), `DELETE /:id`, `GET /search/products`, `GET /search/customers` |
| Company | `/api/company` | `GET /`, `PUT /` |
| Uploads | `/api/upload` | `POST /product/:productId`, `POST /company/logo`, `POST /company/signature` |

## Notes for contributors

- After changing `Backend/prisma/schema.prisma`, run `npx prisma migrate dev` from `Backend/` and commit the generated migration folder along with the schema change.
- Anything reused across 2+ frontend pages belongs in `Frontend/src/components/`, not duplicated per-page (see `CompanyDetailsForm.jsx`, `LogoSignatureUpload.jsx` for the pattern).
- The GST tax-split logic (CGST/SGST vs IGST) lives in `Backend/src/modules/invoice/invoice.service.js` and is mirrored on the frontend in `CreateInvoice.jsx` for a live preview while building an invoice — keep both in sync if this logic ever changes.
- `npm run lint` in `Frontend/` before committing.