# Database Schema

```mermaid
erDiagram
    TENDER {
        String id PK "UUID"
        String portalName "Composite Unique Key"
        String sourceUrl 
        String tenderId "Composite Unique Key"
        String title "Indexed"
        String department "Indexed"
        DateTime closingDate "Indexed, Nullable"
        Float tenderValue "Nullable"
        String currency "Nullable"
        String detailUrl 
        String pdfUrl "Nullable"
        String localPdfPath "Nullable"
        String documentHash "Nullable, SHA-256"
        String status "Nullable"
        Json rawData "Complete raw payload"
        DateTime firstSeenAt 
        DateTime lastSeenAt 
        DateTime createdAt 
        DateTime updatedAt 
    }
```

The database utilizes PostgreSQL and is queried securely via the Prisma ORM.

### Key Constraints:
- `portalName` + `tenderId` form a unique composite key, preventing duplicates across different portals that might coincidentally use the same reference number.
- `tenderValue` and `closingDate` are heavily indexed as they are the primary metrics utilized in BI dashboards and analytical filtering queries.
