# Architecture Document

## Overview
The Valgan Procurement Crawler POC employs a modular, interface-driven architecture to allow seamless addition of multiple procurement portals without duplicating core crawling, normalization, or database logic.

## System Architecture

```mermaid
graph TD
    A[Crawler Runner] -->|Initializes| B[ProcurementCrawler Interface]
    B --> C[UKContractsFinder Adapter]
    B --> D[Other Portal Adapters]
    
    C -->|Fetches HTML| E[External UK Contracts Finder]
    C -->|Downloads| F[PDF Downloader & Hasher]
    C -->|Normalizes| G[Database Service]
    
    H[REST API] --> I[Controllers]
    I --> J[Zod Validators]
    I --> G
    
    G --> K[(PostgreSQL)]
```

## Core Components
1. **Crawler Core (`src/crawlers/core/`)**
   - Defines the `ProcurementCrawler` interface that all portal adapters must implement.
   - Enforces standardization of `crawlListings`, `crawlTenderDetails`, `downloadDocument`, and `normalizeTender`.

2. **Portal Adapters (`src/crawlers/portals/`)**
   - Contains portal-specific HTML parsing, DOM traversal, and request logic.
   - Converts proprietary HTML structures into a standardized `Tender` payload.

3. **Database Layer (`src/database/`)**
   - Utilizes Prisma ORM for type-safe database interactions.
   - Implements robust upsert logic using a composite key `[portalName, tenderId]` to prevent duplicates.

4. **API Layer (`src/controllers/`, `src/routes/`)**
   - Express REST API exposing search and retrieval of parsed tenders.
   - Includes pagination, case-insensitive search, and sorting.

5. **Utilities**
   - `logger.ts`: Pino-based structured JSON logger.
   - `file.ts`: Handles secure PDF saving and SHA-256 hashing.
