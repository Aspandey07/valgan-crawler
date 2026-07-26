# AI Tools Usage Log

In accordance with modern engineering practices, AI tools (GitHub Copilot, ChatGPT, and similar assistants) were used selectively during the development of this proof-of-concept to improve productivity while all architectural and implementation decisions were reviewed and validated by the author.

## Manual Engineering Decisions

The following aspects were designed, implemented, or finalized through engineering judgment:

- Overall system architecture and crawler workflow.
- Adapter pattern (ProcurementCrawler interface) for future extensibility.
- Prisma database schema, indexing strategy, and composite unique constraints.
- Deduplication strategy using PostgreSQL upsert operations.
- Selection of Cheerio for HTML parsing based on the target website.
- Stream-based PDF downloading and SHA-256 hashing.
- Error handling, logging strategy, and API behavior.

## Appropriate Use of AI

AI tools were used as engineering assistants for productivity-oriented tasks, including:

- Generating Swagger/OpenAPI boilerplate.
- Assisting with Express middleware and Zod validation scaffolding.
- Suggesting regular expressions and CSS selectors for HTML parsing.
- Improving code readability, documentation, and README formatting.
- Reviewing code for potential improvements and identifying common best practices.

All AI-generated suggestions were manually reviewed, modified where necessary, tested locally, and integrated only after verification.

## Conclusion

AI was used as a development assistant rather than an autonomous developer. Final architectural decisions, implementation choices, debugging, testing, and technical trade-offs remained the responsibility of the author.
