# Valgan Procurement Crawler POC

This repository contains a full-stack proof-of-concept web crawler and API server built for the Valgan technical hiring assessment.

## Project Overview
The solution crawls government procurement portals to extract tender details, downloads associated documentation (PDFs), stores normalized data in PostgreSQL, and exposes a REST API for searching.

**Selected Portal**: [UK Contracts Finder](https://www.contractsfinder.service.gov.uk/Search)

## Prerequisites
- Node.js 18+ (fetch API)
- Docker & Docker Compose (for PostgreSQL)

## Tech Stack
- **Language**: TypeScript (Node.js)
- **Database**: PostgreSQL (with Prisma ORM)
- **Web Scraping**: Cheerio, native `fetch`
- **API Server**: Express.js
- **Validation**: Zod
- **Logging**: Pino
- **Documentation**: Swagger UI / OpenAPI 3.0

## Setup & Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL via Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Run Database Migrations:**
   ```bash
   npm run prisma:migrate
   ```

## Execution Commands

**Run the Crawler (Extract data & PDFs):**
```bash
npm run crawl
```

**Run the REST API Server (Dev mode):**
```bash
npm run dev
```
*Note: The API runs on `http://localhost:3000` by default. Swagger docs are available at `http://localhost:3000/api-docs`.*

**Run Tests:**
```bash
npm run test
```

## Known Limitations
- The Cheerio selectors target specific HTML classes on the UK Contracts Finder portal. If the government changes their CSS, the parser will require an update.
- The crawler is rate-limited via a basic `setTimeout` (configurable via `REQUEST_DELAY_MS` in `.env`). In production, a distributed queue like RabbitMQ would handle concurrency and proxy rotation.

## Screenshots
Visual evidence of the crawler execution, PostgreSQL data, and the Swagger API are available in the `/screenshots/` directory.

## Scalability
The system is designed with extensibility in mind. For scaling to thousands of websites:
- Crawler execution can be decoupled using a robust message queue (e.g., RabbitMQ).
- Distributed workers utilizing residential proxy networks to avoid rate-limiting.
- Cloud object storage (AWS S3) replacing the local PDF storage layer.

## Future Improvements
- Incremental crawling using change detection.
- Distributed scheduling and workload balancing.
- Comprehensive metrics collection (Prometheus/Grafana).
- Automated integration tests against sample procurement portals.

## Project Structure
- `/src/crawlers/core`: Abstract interface and base utilities for crawling.
- `/src/crawlers/portals`: Specific portal implementations (e.g. UKContractsFinder).
- `/src/controllers` & `/src/routes`: Express route handlers and controller logic.
- `/src/validators`: Zod schema definitions.
- `/src/database`: Prisma ORM client instance.
- `/docs/`: Architectural documentation and schemas.
- `/screenshots/`: Visual evidence of crawler and API execution.

## Documentation
- [Architecture](docs/architecture.md)
- [Engineering Decisions](docs/engineering-decisions.md)
- [Database Schema](docs/database-schema.md)
- [API Documentation](docs/api.md)
- [AI Tool Usage](docs/ai-usage.md)
