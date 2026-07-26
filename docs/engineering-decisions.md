# Engineering Decisions

## Architecture Selection
A modular, interface-driven approach was selected. The core crawler interface (`ProcurementCrawler`) abstracts the portal-specific implementation from the execution engine, database upserting, and API serving. This design allows new portals to be added by implementing a new adapter without altering the core pipeline. **Trade-off:** While this abstraction introduces a slight upfront overhead, it enforces a strict contract that guarantees data uniformity across diverse government portals.

## Why PostgreSQL?
PostgreSQL provides JSON storage (`rawData`), ACID compliance, and indexing capabilities. Procurement data is structured but often has portal-specific quirks, making Postgres a suitable hybrid (structured columns for core fields + JSONB for raw data). Prisma was chosen as the ORM to provide type safety. **Trade-off:** Prisma introduces a slight performance overhead compared to raw SQL drivers, but the developer productivity and compile-time safety gains outweigh this for the current scale.

## Scraping Approach (Static HTML Parsing)
For the UK Contracts Finder, the listings and details pages are fully server-side rendered. Therefore, `cheerio` and the native Node.js `fetch` API were used. This is significantly faster and consumes less memory than full browser automation (e.g., Playwright). **Trade-off:** DOM-based parsing is inherently brittle to UI changes. To mitigate this, CSS selectors are isolated within the adapter, minimizing the blast radius of structural changes.

## Duplicate Handling Strategy
To prevent duplicate tender entries, a composite unique constraint (`[portalName, tenderId]`) is enforced at the database level. The crawler utilizes Prisma's `upsert` functionality, updating mutable fields (title, dates, value, hash) and bumping the `lastSeenAt` timestamp for existing records. **Production Consideration:** At higher volumes, individual upserts will become a database bottleneck; this would be refactored to use bulk/batch upsert operations to reduce connection overhead.

## Document Storage and Hashing
PDFs are downloaded via Node.js streams to a local directory to prevent V8 Out-Of-Memory (OOM) crashes on large files. To detect modifications, the crawler computes a SHA-256 hash of the saved file. In a production scenario, this local storage layer would be replaced with AWS S3 utilizing multipart uploads.

## Error and Logging Strategy
`pino` was selected for logging as it outputs structured JSON with minimal overhead, integrating cleanly with observability stacks (e.g., ELK, Datadog). Express error-handling middleware catches API failures, returning standard JSON responses. The crawler handles DOM-parsing or network exceptions at the record level, logging failures and proceeding without crashing the run. **Future Consideration:** Implementing exponential backoff and retry logic for transient network failures.

## Key Trade-offs
- **Cheerio vs. Playwright:** Cheerio was chosen over Playwright because the selected procurement portal is server-side rendered, providing significantly lower CPU and memory usage.
- **Storage:** Local PDF storage was selected for simplicity in this proof-of-concept; cloud object storage (e.g., Amazon S3) would be preferable in production.
- **Pagination:** Offset-based pagination is sufficient for a proof-of-concept. Cursor-based pagination would be more efficient for very large datasets.
- **Database Architecture:** A single PostgreSQL database simplifies development; a production-scale system could introduce read replicas, partitioning, or sharding based on workload.

## Scalability to 5,000+ Websites
As the system scales to 5,000+ websites, the current architecture would evolve in several ways:
1. **Message Queues:** The crawler execution would be decoupled from Cron jobs using a robust message queue (e.g., RabbitMQ or AWS SQS) to distribute tasks.
2. **Distributed Crawling:** Workers would be deployed across multiple IP addresses or utilize residential proxy networks to avoid rate-limiting.
3. **Headless Browsers at Scale:** Portals requiring Playwright would be routed to a dedicated scalable browser-cluster (e.g., Browserless).
4. **Cloud Object Storage:** PDF storage would move to an S3-compatible service.
5. **Automated Parser Maintenance:** At 5,000 portals, manual maintenance of CSS selectors is unsustainable. The system would require generalized heuristics, anomaly detection to flag broken parsers automatically, and LLM-assisted DOM extraction for unstructured data.

## Future Improvements
- Incremental crawling using change detection to avoid unnecessary processing.
- Distributed scheduling and workload balancing across crawler workers.
- Metrics collection using Prometheus and Grafana dashboards.
- Authentication and rate limiting for public REST APIs.
- Automated integration tests against sample procurement portals.
