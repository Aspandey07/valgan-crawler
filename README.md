# Valgan Procurement Data Platform

A robust, production-ready backend service designed to crawl, extract, and serve government procurement tenders. Built as a technical assessment for the Founding Data Platform Engineer role at Valgan.

## 🚀 Reviewer Quick Start (Under 2 Minutes)

Once the application is deployed, you can immediately test the entire workflow:

1. **Open the Live Frontend UI:**
   Navigate to the root URL (e.g., `https://YOUR_DEPLOYED_URL/`) in your browser to access the visual testing interface.

2. **Open Swagger Documentation:**
   Navigate to `/api-docs` (e.g., `https://YOUR_DEPLOYED_URL/api-docs`) to explore the interactive API documentation.

3. **Authorize the API:**
   - In Swagger UI, click the **Authorize** button.
   - Enter the test API key: `valgan-secret-key-2026`
   - (Or use the API Key input field in the Frontend UI).

4. **Search Tenders:**
   - Execute a `GET /api/v1/tenders/search?q=services` request in Swagger or the Frontend UI to see paginated results.

5. **View Tender Details:**
   - Copy a `tenderId` from the search results and execute `GET /api/v1/tenders/{id}` to view full extraction details, including the SHA-256 document hash.

6. **Import Postman Collection:**
   - Download the `valgan_postman_collection.json` from the repository root.
   - Import it into Postman.
   - Set the `baseUrl` collection variable to the deployed URL.

---

## 🛠️ Project Overview

This platform acts as a centralized repository for public procurement data. 

**Key Features:**
- **Automated Crawler:** Extracts structured data and raw JSON from UK Contracts Finder.
- **Idempotent Upserts:** Prevents duplicate records using Composite Unique Constraints (`portalName` + `tenderId`) in PostgreSQL.
- **Smart PDF Processing:** Streams document downloads directly to disk, generating SHA-256 hashes to prevent duplicate file storage.
- **REST APIs:** Secured, paginated, and searchable endpoints for downstream consumption.
- **API Key Security:** Lightweight `x-api-key` middleware for secure reviewer testing.

---

## 🏗️ Architecture Summary

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (with Prisma ORM)
- **Scraping:** Cheerio (fast HTML parsing), native fetch
- **Validation:** Zod (strict runtime type checking)
- **Logging:** Pino (structured JSON logging)
- **Documentation:** OpenAPI 3.x (Swagger UI)

*The system uses an Adapter Pattern (`ProcurementCrawler` interface) allowing seamless integration of new portals (e.g., US SAM, Indian CPP) without modifying the core API logic.*

---

## 🌍 Deployment & Setup

This application is designed to be deployed to any modern cloud provider (Render, Railway, VPS, Hostinger) with an external PostgreSQL database (Neon.tech, Supabase).

### Required Environment Variables

Create a `.env` file (see `.env.example`) with the following:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
API_KEY=valgan-secret-key-2026
CORS_ORIGIN=*
LOG_LEVEL=info
CRAWL_RECORD_LIMIT=5
```

### 1. Build and Deploy

```bash
# Install production dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Apply database migrations to the production DB
npm run prisma:deploy

# Build TypeScript
npm run build

# Start the server
npm start
```

### 2. Populate Sample Data (For Reviewers)

To ensure the system isn't empty, you can run the safe seed script. This executes a controlled, 1-page crawl of the real UK Contracts Finder to populate authentic sample data.

```bash
# Seed the database with sample data
npm run seed
```

*(Alternatively, run a full crawl with `npm run crawl`)*

> **Note on Storage:** Downloaded PDFs are stored in the `./downloads` directory. On ephemeral hosting (like Render's free tier), these files may be lost between deployments. For a true production environment, an S3-compatible storage adapter should be implemented.

---

## 🧪 API Usage & `curl` Examples

### Health Check (Public)
```bash
curl https://YOUR_DEPLOYED_URL/health/ready
```

### List Tenders (Authenticated)
```bash
curl \
  -H "x-api-key: valgan-secret-key-2026" \
  "https://YOUR_DEPLOYED_URL/api/v1/tenders?page=1&limit=10"
```

### Search Tenders (Authenticated)
```bash
curl \
  -H "x-api-key: valgan-secret-key-2026" \
  "https://YOUR_DEPLOYED_URL/api/v1/tenders/search?q=construction"
```

---

## 🔒 Security Note

Authentication is implemented via a static `x-api-key` header to satisfy the reviewer testing requirements without the unnecessary overhead of a full user management system (JWT/OAuth).

---

## 🐋 Docker Setup (Local Development)

A `docker-compose.yml` is provided for immediate local PostgreSQL setup.

```bash
docker-compose up -d postgres
npm install
npm run prisma:migrate
npm run dev
```
