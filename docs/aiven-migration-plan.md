# Portfolio database migration plan — approval required

Inspection date: 28 October 2026. This is a plan, not an executable migration. No tables, indexes, constraints, records, users, or privileges were changed. No initialization, seed, migration, backup export, application cutover, commit, push, or deployment was run.

## Verified current state

Both configured databases were inspected independently through the existing mysql2 Promise pool configuration. The local settings came explicitly from `backend/.env`; Aiven settings came explicitly from `backend/.env.aiven`. The Aiven socket was confirmed encrypted and authorized with certificate and hostname verification enabled. Each inspection used a repeatable-read, read-only transaction and a consistent snapshot. Only SELECT queries and session/transaction controls were executed; transactions were rolled back and connections closed afterward.

Results reflect the configured accounts' metadata visibility and the selected databases, not every database on either server. Counts must be checked again immediately before any approved execution, since later application activity could change them.

| Item                                   | Local MySQL                                                | Aiven MySQL          |
| -------------------------------------- | ---------------------------------------------------------- | -------------------- |
| Server version                         | 8.0.42                                                     | 8.4.11               |
| `contact_messages`                     | Present: **1 record**, status `new`                        | Table absent         |
| `projects`                             | Present: **4 records**, all published                      | Table absent         |
| `qa_evidence`                          | Present: **9 records**, all published and summary-approved | Table absent         |
| Base tables / views                    | 3 / 0                                                      | 0 / 0 visible        |
| Foreign keys                           | 0                                                          | 0                    |
| Triggers / routines / scheduled events | 0 / 0 / 0                                                  | 0 / 0 / 0 visible    |
| Database default character set         | `utf8mb4`                                                  | `utf8mb4`            |
| Database default collation             | `utf8mb4_unicode_ci`                                       | `utf8mb4_0900_ai_ci` |
| Session / system timezone              | `SYSTEM` / Sri Lanka Standard Time                         | `SYSTEM` / UTC       |

Local has 49 columns, 11 indexes (24 indexed column parts), and 21 enforced CHECK constraints, plus three primary keys and two unique-slug constraints. All three tables use InnoDB and `utf8mb4_unicode_ci` table defaults. Slug columns explicitly use ASCII / `ascii_bin`.

The four project and nine QA database records match the current static migration-source fields exactly; there were no additional catalogue records or differing source fields. This comparison does not equate IDs or timestamps with static data, because static seeds do not contain those database fields. Project IDs and slugs are each distinct across all four records; QA IDs and slugs are distinct across all nine records. QA sharing flags are: 9 summary-approved, 9 public-report-approved, and **2 source-reviewed / 7 not source-reviewed**. These distinctions must remain intact.

Only aggregate counts/statuses were inspected for Contact; private names, email addresses, and message contents were not selected or printed. No credentials, service connection URIs, or certificate contents were printed. Both environment files were confirmed byte-for-byte unchanged by each inspection.

## Required schema and indexes

| Table              | Columns / checks                   | Required indexes                                                                                                                                                                        |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contact_messages` | 8 columns; 3 non-empty text CHECKs | PK `id`; `idx_contact_messages_created(created_at,id)`; `idx_contact_messages_status_created(status,created_at,id)`                                                                     |
| `projects`         | 20 columns; 7 CHECKs               | PK `id`; unique `uq_projects_slug(slug)`; `idx_projects_published_order(is_published,display_order,id)`; `idx_projects_category_order(category,is_published,display_order,id)`          |
| `qa_evidence`      | 21 columns; 11 CHECKs              | PK `id`; unique `uq_qa_evidence_slug(slug)`; `idx_qa_evidence_published_order(is_published,display_order,id)`; `idx_qa_evidence_category_order(category,is_published,display_order,id)` |

No foreign keys are defined or required by the current backend. Do not invent project-to-evidence relationships during migration. The checked-in baseline is `backend/database/schema.sql`; Phase 05 adds three NOT NULL Boolean columns, default FALSE, and their CHECKs through `backend/database/migrations/005-qa-approval.sql`: `summary_approved`, `source_reviewed`, and `public_report_approved`. A complete target definition needs all three, not just the baseline.

Preserve unsigned IDs, nullable fields, JSON arrays, text lengths, the Contact status ENUM, millisecond DATETIME precision, timestamp defaults/update behavior, display ordering, publication flags, and separate QA approval/review flags. Expected source next AUTO_INCREMENT values at inspection were Contact **3**, Projects **5**, QA **10**; preserve these or a higher safe value, never rewind a counter.

## Differences requiring deliberate handling

1. **All application tables are absent on Aiven.** There is no existing target table definition to alter or target application data to reconcile at this snapshot. Recheck before execution; if anything appears, stop and compare it instead of overwriting it.
2. **Collation defaults differ.** Explicitly create the target tables with the inspected source table/column collations. Do not inherit Aiven's different database default accidentally. The database-wide default need not be changed.
3. **Timezone conventions differ.** DATETIME values are timezone-naive; the driver's `timezone: 'Z'` is a conversion setting and does not set MySQL's session timezone. Copy historical DATETIME(3) values as exact strings without conversion. Before any later API cutover, confirm the historical convention and align target runtime sessions with it (currently local Sri Lanka time), or separately approve a reviewed UTC conversion. Do not mix historical local-time values with new UTC defaults unnoticed. This plan does not switch the API to Aiven.
4. **SQL modes differ.** Both enforce strict behavior; Aiven additionally has ANSI modes (`ANSI_QUOTES`, `PIPES_AS_CONCAT`, `REAL_AS_FLOAT`) and `STRICT_ALL_TABLES`. Use bound parameters and backtick-quoted identifiers, validate the data first, and test the approved DDL/data load in a scratch environment. Do not disable strict modes to conceal incompatibilities.
5. **Server versions differ.** Review export/import compatibility from MySQL 8.0.42 to 8.4.11, including authentication, defaults, CHECK enforcement, JSON values, character encoding, and managed-service privileges. A successful SSL/SELECT check does not prove CREATE/ALTER/import privileges.

## Existing scripts: reuse with care

- `db:init` creates missing baseline tables using `CREATE TABLE IF NOT EXISTS`. It does not reconcile incompatible existing definitions and does not add the Phase 05 approval columns.
- `db:migrate:projects` reads static frontend data, inserts missing slugs transactionally, and preserves matching slugs. It does not compare existing project content or copy live local IDs/timestamps/local-only edits.
- `db:migrate:qa` also reads static frontend data. It performs guarded approval-schema changes before its data transaction, inserts missing approved slugs, and returns differing/preserved entries for review. It does not overwrite them or copy original IDs/timestamps.
- These seed INSERTs set publication/approval values from their source modules and omit `id`, `created_at`, and `updated_at`. They are not a full local-database transfer, even though the current catalogue content matches those sources.
- Both seed services check that some unique index contains `slug`; their preflight is not a complete schema comparison. The inspected local indexes are the intended single-column unique slug indexes. Confirm that exact shape on the prepared target.
- The existing CLI scripts default to the local pool. **Do not repoint local `.env` or run these commands assuming they target Aiven.** Any approved transfer must use explicitly separate local and Aiven pools/configurations.
- Do not blindly rerun the raw approval SQL against a partially prepared target. DDL has implicit commits; repeated ADD operations can fail and are not protected by a data transaction.

## Proposed execution after approval

1. **Approve scope and preserve a baseline.** Proposed full transfer is 4 projects, 9 QA entries, and the 1 private Contact message: **14 records**. Explicit approval must include uploading that Contact message to Aiven. If it is excluded, leave it intact locally and document that target history is intentionally incomplete. Reinspect counts, definitions, publication states, and target emptiness immediately before the approved run. Refuse unresolved changes or identity conflicts. Verify source/destination are distinct and retain the local configuration unchanged.
2. **Back up and rehearse.** After approval, create a secure logical backup of the selected local database and capture the target's baseline/backup. Keep dumps encrypted or access-restricted, outside Git and public assets. Verify restoration in a separate approved scratch environment before the real import. A single-transaction InnoDB export can provide a consistent snapshot; prevent concurrent schema changes during export. Review options such as `--single-transaction`, `--quick`, `--no-tablespaces`, `--set-gtid-purged=OFF`, and `--skip-add-drop-table` for this standalone managed-service transfer. Do not export system schemas, accounts, credentials, unrelated databases, or global GTID/server settings. No backup was generated during this planning task.
3. **Prepare only the reviewed target schema.** With a separate setup account and verified SSL, create the three absent tables with their complete reviewed definitions, including the approval columns, CHECKs, keys, explicit collations, and safe ID counters. Compare every column/type/default/index/constraint before importing data. Do not drop or truncate anything. If target objects already exist or differ, stop for a new reviewed additive plan; do not silently skip incompatible definitions. Keep schema work separate from the data transaction because MySQL DDL commits implicitly.
4. **Copy actual local database rows.** Use a dedicated transfer operation that explicitly reads local configuration and writes through the Aiven configuration, without changing either environment file. Use the live source rows rather than static seeds. During the final snapshot, pause local application writes (including Contact submissions) or establish an approved catch-up process; do not permit a snapshot-to-cutover gap to lose new messages. Use parameterized inserts in one target data transaction, preserving IDs, all content fields, JSON, NULLs, status, original timestamp strings, ordering, and publication/approval flags. Do not use REPLACE, destructive upsert, blanket INSERT IGNORE, or automatic deduplication by email/message.
5. **Validate before committing.** Compare exact counts and IDs, unique slugs, every field, JSON semantics, raw timestamp strings, flags, and indexes/constraints. Expected current full-transfer counts are 1/4/9, published project count 4, public QA count 9, reviewed-source count 2. Verify the next IDs are at least the captured source values and greater than the retained maximum IDs; reserve any necessary higher counters during schema preparation, not by injecting DDL into the data transaction. On any mismatch, roll back the data transaction. Do not claim a DDL rollback: any created tables remain and require explicit cleanup approval if removal is desired.
6. **Make retries and later cutover safe.** Keep a secure import manifest/source-ID mapping and compare rows before retrying. For Projects/QA, detect both slug and numeric-ID collisions; skip only verified identical imported rows, otherwise stop. Contact has no natural deduplication key: use the approved manifest and exact original-ID/full-row comparison, not heuristics. Verify read-only API result parity against Aiven after commit without repointing the normal local API. Any later production connection switch, timestamp policy change, deployment, or write test is a separate approved step. Once Aiven accepts new writes, rollback must preserve/reconcile those writes rather than simply switching to an old local snapshot.

## Risks and controls

- **Private Contact data:** one historical message is present. No content was exposed by inspection; future dumps/imports need restricted handling and explicit transfer approval.
- **Loss through static reseeding:** live IDs, timestamps, edits, and Contact history are not preserved by static seed commands. Use actual database rows and exact-field validation.
- **Concurrent changes / duplicate retries:** recheck the baseline, establish a write-free snapshot or catch-up plan, retain unique keys and an import manifest, and abort on conflicts.
- **Time/collation/SQL-mode changes:** preserve explicit definitions and raw timestamps, rehearse compatibility, and resolve runtime timezone policy before cutover.
- **Partial DDL or failure after commit:** schema operations cannot be rolled back with the data transaction. Keep reviewed backups and recover through an approved non-destructive plan; do not automatically delete target objects or records.
- **Managed-service access and backup constraints:** verify setup privileges and the actual Aiven backup/restore options before writing; keep runtime accounts restricted. No grants were inspected or modified in this task.

## Git and configuration safety

- `backend/.env.aiven`: ignored by Git and not tracked.
- `backend/.env`: ignored by Git and not tracked; unchanged.
- The configured CA uses a file inside the repository: it is ignored and not tracked. Its path and contents are intentionally not included here.
- One backend certificate/key file was found; all such files are ignored. No certificate/key files are tracked anywhere in the current repository listing.
- Rules cover `backend/certs/` and common PEM/certificate/key extensions. Both environment files were confirmed unchanged, and no frontend or backend application source was modified for this inspection.

Sanitized inspection metadata is saved under the Git-ignored `artifacts/` directory: `local-database-inspection.json`, `aiven-database-inspection.json`, and `database-migration-git-inspection.json`. These contain schema metadata and aggregate results, not credentials, CA contents, or Contact record contents. The temporary inspection helper is also ignored and contains SELECT-only inspection logic, not migration operations.

References: [MySQL 8.4 logical backup options](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html). Source definitions and seed services were reviewed directly from this repository. The plan stops here and requires explicit approval before any schema preparation, record copy, backup rehearsal that creates objects, or cutover.
