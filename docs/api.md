# API Documentation

The Valgan Procurement Crawler exposes a REST API powered by Express.js and Zod schema validation.
Swagger documentation is available at `http://localhost:3000/api-docs` when the server is running.

## 1. Search Tenders
**Endpoint:** `GET /api/v1/tenders`

**Query Parameters:**
| Name | Type | Description |
|---|---|---|
| `q` | string | Case-insensitive search on tender title. |
| `department` | string | Case-insensitive search on department. |
| `portal` | string | Exact match for portal name. |
| `closingDateFrom` | ISO Date | Filter tenders closing after this date. |
| `closingDateTo` | ISO Date | Filter tenders closing before this date. |
| `page` | int | Pagination page (default: 1). |
| `limit` | int | Pagination limit (max 100, default: 20). |
| `sortBy` | string | Field to sort by (default: `createdAt`). |
| `sortOrder` | string | `asc` or `desc` (default: `desc`). |

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/tenders?q=software&page=1&limit=5&sortBy=closingDate&sortOrder=desc"
```

## 2. Get Tender Details
**Endpoint:** `GET /api/v1/tenders/:id`

**Path Parameters:**
- `id`: UUID of the tender in the PostgreSQL database.

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/tenders/b7264a93-78b1-4cd4-8846-5b4d6cf5ff27"
```

## 3. Health Check
**Endpoint:** `GET /health`

**Example Request:**
```bash
curl "http://localhost:3000/health"
```
