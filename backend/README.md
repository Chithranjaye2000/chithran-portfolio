# Portfolio backend — Phases 01–05

A separate Node.js/Express API and MySQL database for the existing React/Vite portfolio. The frontend retains its package, build, design, themes, and animations. Its Contact form saves through the API; Projects and QA Evidence load their published records from MySQL.

Implemented: health, Contact submission, read-only Projects and QA Evidence endpoints, input validation, contact rate limiting, configurable SMTP notifications, safe error responses, and content migration commands. There are no project/evidence write endpoints or admin dashboard. This implementation stops after Phase 05; nothing here commits, pushes, or deploys the project.

## Requirements

- Node.js **20.19+ on the 20.x line, or 22.12+**; this workspace has Node 22.15.
- MySQL **8.0.16+**, so the schema's `CHECK` constraints are enforced.
- Two PowerShell terminals for the frontend and backend.

Runtime dependencies are pinned to Express **5.3.0**, CORS **2.8.6**, mysql2 **3.24.6**, and Nodemailer **10.2.1**. Node's built-in environment-file loader and watch mode avoid additional packages.

## Install and configure

In a PowerShell terminal:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio\backend'
npm ci
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
notepad .env
```

The copy preserves any existing `.env`. Replace its database placeholders with the account you configure below. Never put a real password in `.env.example`, SQL files, frontend files, or Git.

| Setting           | Local value or purpose                                                        |
| ----------------- | ----------------------------------------------------------------------------- |
| `NODE_ENV`        | `development` locally                                                         |
| `PORT`            | `3001` for the API                                                            |
| `FRONTEND_ORIGIN` | `http://127.0.0.1:5173` when using the frontend URL below                     |
| `DB_HOST`         | `127.0.0.1` for the local database                                            |
| `DB_PORT`         | `3306`, or the port your local MySQL instance uses                            |
| `DB_NAME`         | `portfolio_backend` in the SQL example below                                  |
| `DB_USER`         | `portfolio_app` in the SQL example below                                      |
| `DB_PASSWORD`     | The local account's non-empty password; quote values containing `#` or spaces |

`FRONTEND_ORIGIN` must be one HTTP(S) origin, without a path or wildcard. `http://localhost:5173` and `http://127.0.0.1:5173` are different browser origins: use the exact one you open. If you change the frontend port, update this value and restart the API.

Only `backend/.env` is loaded, resolved relative to the backend source rather than the terminal's working directory. Existing process environment variables take precedence. The API can start and return health without database configuration, but Contact, Projects, QA Evidence, and the connection check need working database settings. Do not prefix database or SMTP settings with `VITE_`: Vite variables are public frontend configuration, not a place for credentials.

### SMTP notifications

Configure these **only in `backend/.env`** when you are ready to send real notification emails:

| Setting         | Purpose                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `SMTP_HOST`     | SMTP server hostname, without a URL scheme                                                   |
| `SMTP_PORT`     | Provider's SMTP port; defaults to `587`                                                      |
| `SMTP_SECURE`   | `false` for required STARTTLS, commonly port 587; `true` for implicit TLS, commonly port 465 |
| `SMTP_USER`     | Provider's authentication username                                                           |
| `SMTP_PASSWORD` | Provider's password or application password; never commit it                                 |
| `SMTP_FROM`     | One bare sender email address approved by your provider                                      |
| `SMTP_TO`       | One bare email address that receives portfolio notifications                                 |

Host, username, password, sender, and recipient must all be present. `SMTP_SECURE` accepts `true` or `false`. Replace the example placeholders before using SMTP; missing or invalid settings do not become a fake successful notification. The validated visitor email is used only as `replyTo`; the visitor cannot choose the notification sender or recipient. Notifications use a fixed subject and plain text.

The database insert completes **before** the notification attempt. Delivery is awaited within the request rather than launched as background work that could disappear in a serverless invocation. If SMTP is absent, rejects the message, or fails, the saved database record remains and the API returns `201` with `notification: "unavailable"`. `notification: "sent"` means the SMTP transport accepted the notification; it does not prove inbox delivery or that it was read. Automated tests mock email transport. Real SMTP delivery must be checked separately after provider configuration; it is not established by the mocked tests.

### npm launcher workaround on this computer

If `npm` reports a missing roaming `npm-cli.js`, use the installed CLI directly from the same working directory:

```powershell
$portfolioNpmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
node $portfolioNpmCli ci
node $portfolioNpmCli run dev
```

Use the same substitution for `npm start`, `npm test`, and database scripts; for example, `node $portfolioNpmCli run db:check` or `node $portfolioNpmCli run db:migrate:qa`. It also works in the frontend root directory.

## Configure local MySQL

Start your installed local MySQL server using its normal service or management tool. The installed client in this workspace is:

```powershell
$portfolioMySql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
& $portfolioMySql --host=127.0.0.1 --port=3306 --user=root --password
```

Enter the existing administrator password at the prompt. `--password` without a value prompts securely; do not append a password to the command.

At the `mysql>` prompt, run the following first-time setup. Replace the password placeholder **inside the interactive MySQL session** with a strong local password. Use an unused application username, or configure an existing account with its current credentials instead.

```sql
CREATE DATABASE portfolio_backend
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'portfolio_app'@'127.0.0.1'
  IDENTIFIED BY 'REPLACE_WITH_A_STRONG_LOCAL_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON portfolio_backend.* TO 'portfolio_app'@'127.0.0.1';

EXIT;
```

The application account has no schema-management privileges. Initialize the schema separately with the administrator account, from PowerShell:

```powershell
& $portfolioMySql --host=127.0.0.1 --port=3306 --user=root --password --database=portfolio_backend --execute='source D:/SLT QA/My_Portfolio/backend/database/schema.sql'
```

Enter the administrator password at the prompt. The checked-in SQL file contains no users, passwords, or portfolio data. It creates:

- `contact_messages`: sender, email, optional subject, message, workflow status, and timestamps.
- `projects`: unique slug, descriptive content, optional period/links, JSON tag/detail arrays, ordering, and publication state.
- `qa_evidence`: unique slug, tool/category, scope, recorded result, limitations/source note, optional report link, JSON arrays, ordering, and publication state.

All tables use InnoDB and `utf8mb4`; constraints reject empty required content, invalid slugs, non-array list fields, and invalid publication values. New records default to unpublished. The reviewed migration commands below explicitly publish only the existing approved source entries they insert. Indexes support chronological messages and publication/category/order queries. There are no invented records or project-to-evidence foreign-key relationships.

The initialization script uses `CREATE TABLE IF NOT EXISTS` and can be rerun without deleting records. It does **not** migrate an existing table definition; future structural changes require migrations. `DATETIME` defaults follow the MySQL session time zone. The driver's `timezone: 'Z'` setting controls date conversion and does not change the server/session time zone. Configure a consistent MySQL time zone before storing real records; this setup does not change global database settings.

Update `backend/.env` with `DB_NAME=portfolio_backend`, `DB_USER=portfolio_app`, and the password entered above. Keep the file local.

### Initialize the schema and migrate existing portfolio content

Run these commands from the backend directory, in order:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio\backend'
npm run db:init
npm run db:migrate:projects
npm run db:migrate:qa
npm run db:check
```

`db:init` requires a setup account with `CREATE` privileges if any base tables are missing. The first `db:migrate:qa` requires `ALTER` privileges to add approval metadata. Use a schema-management account in the ignored `backend/.env` for this setup step, then restore your normal `portfolio_app` runtime credentials **before starting the API**. Do not grant schema-management privileges to the runtime account. The existing interactive `mysql --password` command above remains an alternative way to initialize the base schema.

The scripts first inspect the current table definitions and identifiers. They never drop tables, truncate records, or replace existing content:

- `db:init` executes the reviewed base `database/schema.sql`, creating only missing tables. It does not migrate existing table definitions.
- `db:migrate:projects` imports the existing records from `../src/data/portfolio.js`. A transaction inserts missing unique slugs only. Existing content, publication settings, and database edits are preserved; `preservedSlugs` identifies existing rows.
- `db:migrate:qa` first applies the additive `database/migrations/005-qa-approval.sql` plan for three Boolean fields: `summary_approved`, `source_reviewed`, and `public_report_approved`. Their defaults are `FALSE`, and Boolean checks are added. The runner checks existing metadata so compatible completed steps are skipped on reruns; use the runner rather than blindly rerunning the raw `ALTER TABLE` file.
- MySQL DDL commits implicitly, so the approval schema changes finish **before** the QA data transaction. A failed data transaction rolls back its inserts but cannot roll back completed DDL. Rerun the command after resolving the cause; no automatic destructive rollback is attempted.
- The QA data transaction imports only entries whose existing source has `summaryApproved: true`. It preserves all existing matching slugs, including drafts and manually edited rows. `reviewSlugs` lists existing records whose content or publication/approval values differ and need owner review. The command does not silently approve, republish, or overwrite those rows.

Original frontend data files remain as content provenance and migration inputs. Changing those files and rerunning an insert-only migration does **not** overwrite an existing database record: review and apply intentional content changes in your trusted database tool. Once integrated, the portfolio reads Projects and QA Evidence from the API. A failed API/database request displays an explicit error and retry action; it does not silently fall back to static cards and pretend retrieval succeeded.

## Verify the database connection

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio\backend'
npm run db:check
```

Expected success:

```text
MySQL connection verified: SELECT 1 succeeded.
```

This command executes only `SELECT 1 AS connection_ok` through mysql2's Promise API, then closes the pool. It does not import the schema or write data. A failure exits with code `1` and a generic configuration/service message; passwords, connection strings, raw driver errors, and SQL connection details are not printed.

For a schema check, open the client with the application account and inspect the selected database:

```powershell
& $portfolioMySql --host=127.0.0.1 --port=3306 --user=portfolio_app --password --database=portfolio_backend --execute='SHOW TABLES;'
```

Successful automated or isolated verification does not configure another machine's MySQL account. Your local check succeeds only after the service is running, the schema is imported, and your own `.env` values are correct. Do not share the `.env` file or passwords when reporting connection problems.

## Run both applications

The optional **root** `.env` configures the public API base address for Vite. Prepare it without replacing an existing file:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
notepad .env
```

`VITE_API_BASE_URL=http://127.0.0.1:3001` points to the local API. When the variable is absent, development uses that same default; a production build uses same-origin `/api/...` requests. An explicitly blank value also selects same-origin requests. Set an explicit public backend base URL when using a separate API origin, without adding `/api` to the end of the usual origin. Restart Vite after editing the file and rebuild when changing production configuration. This address is public; database and SMTP credentials belong only in `backend/.env`. Production routing/hosting is a later approved phase, so same-origin production defaults do not imply a deployed backend exists.

PowerShell terminal 1 — existing frontend:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. Contact details and mailto/tel/social links remain available. The form saves through the API; project and QA cards use API-loaded public records. The existing layouts, glass surfaces, theme controls, card details, and carousel interactions are retained.

PowerShell terminal 2 — backend:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio\backend'
npm run dev
```

The API listens only on `127.0.0.1` locally, normally at **http://127.0.0.1:3001**. `npm run dev` uses Node watch mode; restart after changing environment values. For a normal local process without watch mode, use `npm start`. Press **Ctrl+C** in the corresponding terminal to stop either application.

From another PowerShell terminal:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -Method Get
```

The JSON response is:

```json
{
  "status": "ok",
  "service": "chithran-portfolio-api",
  "message": "Portfolio API is running."
}
```

Health is API liveness, **not database readiness**. It deliberately works while MySQL is unavailable. Use `npm run db:check` to check MySQL. There is no public database-diagnostics endpoint, database credential exposure, or direct React-to-MySQL connection. CORS controls browser access; it is not API authentication.

## API contracts

All feature endpoints return JSON. Expected failures use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "email": "Enter a valid email address." }
  }
}
```

`fields` is present only for field-validation errors. Responses do not expose database connection details, raw SQL, credentials, or stack traces. Health keeps its existing status JSON shown above.

| Method | Endpoint               | Purpose                               |
| ------ | ---------------------- | ------------------------------------- |
| `GET`  | `/api/health`          | API liveness, independent of MySQL    |
| `POST` | `/api/contact`         | Validate and save a contact message   |
| `GET`  | `/api/projects`        | Paginated published projects          |
| `GET`  | `/api/projects/:id`    | One published project                 |
| `GET`  | `/api/qa-evidence`     | Paginated approved public QA evidence |
| `GET`  | `/api/qa-evidence/:id` | One approved public QA record         |

### Contact

Send `Content-Type: application/json` with `name`, `email`, `message`, and optionally `subject`. Extra fields, nested values, unsupported control characters, and malformed inputs are rejected. Names and text are trimmed and Unicode-normalized; name spacing and message line endings are normalized, and the email domain is normalized to lowercase. Subject can be omitted or blank and is then stored as `NULL`.

| Field     | Requirement             | Maximum Unicode characters |
| --------- | ----------------------- | -------------------------- |
| `name`    | Required                | 120                        |
| `email`   | Required, valid address | 254                        |
| `subject` | Optional                | 200                        |
| `message` | Required                | 5000                       |

JSON bodies are limited to **32 KB**. Valid content is inserted with SQL parameter placeholders. A successful write returns `201`:

```json
{
  "data": { "saved": true, "notification": "unavailable" },
  "message": "Your message was saved. The email notification is currently unavailable."
}
```

The other notification value is `"sent"`, with a saved-message acknowledgement. The frontend requires HTTP `201`, `saved: true`, and a recognized notification value before displaying success. It disables duplicate submissions while pending and retains entered values on failure. A timeout or cancelled request is described as **unconfirmed**; do not assume the server did not save a request whose response was lost.

Contact status codes: `201` saved; `400` malformed JSON; `413` oversized body; `415` unsupported content type; `422` invalid fields; `429` contact rate limit; `503` database write unavailable. Email notification failure after a successful insert still returns `201`; it does not undo the saved message.

The default limiter permits **five requests per IP per 15 minutes** that reach the contact route. It supplies `RateLimit-*` headers and a `Retry-After` value in seconds on rejection. Storage is a bounded in-process map with at most 10,000 IP entries; expired entries are cleaned during requests, with no background cleanup timer. This is a per-instance local safeguard, not a shared global serverless quota. A future deployment must review trusted proxy/IP handling and use an appropriate shared-store limiter; no such deployment configuration is introduced here.

### Projects and QA lists

Both collections return `200` with `data` and `pagination`. A confirmed empty result has this shape:

```json
{
  "data": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

`page` defaults to `1` and must be an integer from `1` to `10000`. `pageSize` defaults to `20` and must be an integer from `1` to `50`. Filters must be non-empty strings within their limits; repeated parameters, unsupported names, control characters, and malformed values return `400 INVALID_QUERY`. Queries use parameter binding; ordering is `display_order`, then `id`.

Public `id` values are positive unsigned-BIGINT identifiers serialized as **strings**, not JavaScript numbers. The original frontend identifier remains in `slug`. Detail routes accept the numeric string `id`, not the slug, and return `200` with `{ "data": ... }`. Invalid or out-of-range identifiers return `400 INVALID_IDENTIFIER`. Missing, unpublished, and otherwise non-public records return `404`; the API does not disclose which private state applies. Database failures return a safe `503 DATABASE_UNAVAILABLE` error.

Projects support the `category` filter, up to 80 characters:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/projects?category=Web%20%26%20mobile&page=1&pageSize=20'
```

Only `is_published = 1` rows are returned. Project DTOs preserve `id`, `slug`, `number`, `label`, `fullTitle`, `title`, `date`, `category`, `context`, `image`, `summary`, `technologies`, `overview`, `contributions`, `note`, `repositoryUrl`, and `demoUrl`. Optional unsafe or private links are omitted as `null`; current original public image paths remain supported. A `featured` filter is **not supported** because the existing schema and source content do not define featured status. Supplying it returns `400` rather than inventing metadata.

QA Evidence supports these existing fields:

| Query parameter | Meaning                                                                                                        | Maximum characters |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| `category`      | Testing category ID such as `automation`, `api`, `performance`, `mobile`, `security`, `analysis`, or `reports` | 80                 |
| `tool`          | Primary tool, such as `Playwright`                                                                             | 100                |
| `context`       | Existing descriptive context                                                                                   | 255                |

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/qa-evidence?category=automation&tool=Playwright&page=1&pageSize=20'
```

Filters can be combined. There is no separate project relationship in the current schema, so a `project` filter is **not supported**; `context` is a descriptive field, not a fabricated project ID.

QA DTOs preserve `id`, `slug`, `title`, `category`, `primaryTool`, `technologies`, `context`, `summary`, `scope`, `result`, `implementation`, `limitations`, `sourceNote`, `summaryApproved`, `sourceReviewed`, `publicReportApproved`, `reportUrl`, and `reportOnly`. The public API requires both `is_published = 1` and `summary_approved = 1`. A report link is exposed separately only when its public-sharing flag is approved and the URL passes public-link checks. Private/internal URLs and local source paths are not returned.

Summary approval, source review, and report-link approval have distinct meanings. The seven owner-supplied summaries remain marked as not reviewed against original PDFs; BrowserStack and Allure retain their reviewed-source metadata. Approved links do not imply the linked reports were independently re-executed or their original findings rerun. Migration preserves the existing recorded results, limitations, source notes, and approved URLs without inventing evidence.

The frontend loads complete validated collections, checks pagination and record identities, and rejects inconsistent or duplicate API data rather than showing a partial success. Loading, confirmed-empty, and failed-request states are separate. QA category filters, carousel controls, dragging/swiping, pause/resume, and expandable details operate on the API-loaded records.

## Architecture and future serverless use

```text
backend/
  database/schema.sql
  database/migrations/005-qa-approval.sql
  scripts/           connection check, schema initialization, and content imports
  src/
    config/          backend environment, lazy database pool, and SMTP settings
    controllers/     health, Contact, Projects, and QA Evidence response handling
    services/        database operations, notifications, and content imports
    routes/          public endpoint composition
    middleware/      CORS, contact rate limiting, not-found, and safe errors
    validators/      Contact fields, catalogue queries/IDs, and public URLs
    app.js           configured Express application; no listening socket
    server.js        local HTTP startup and graceful shutdown
```

The pool is reused lazily within a process, with at most five connections, two idle connections, a queue limit of 20, and a five-second connection timeout. Importing the Express app does not open a database connection. Multiple SQL statements are disabled in the runtime driver. List-filter values, record IDs, and contact fields use parameter bindings. Public catalogue queries select only the fields needed by the portfolio.

`app.js` exports the Express application independently of `server.js`. A later Vercel-compatible entry point can import that application instead of starting a persistent listener. Vercel Functions do not guarantee a continuously running Express process: each warm function instance can have its own pool, so connection budgets, reachable database hosting, TLS, runtime limits, and lifecycle handling must be planned before deployment. No Vercel entry point, routing configuration, hosting connection, or deployment is added in these phases.

Official references: [Express API](https://expressjs.com/en/5x/api.html), [mysql2 Promise API](https://sidorares.github.io/node-mysql2/docs/documentation/promise-wrapper), [Nodemailer SMTP](https://nodemailer.com/smtp), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).

## Checks

Backend:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio\backend'
npm test
npm run db:check
```

Existing frontend and repository checks:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
npm run format:check
npm run lint
npm test
npm run build
```

Tests cover the feature contracts, validation, safe failures, migration behavior, and mocked email delivery. Run both suites: the backend suite does not replace the existing frontend regression tests. Browser verification should also check real API loading, empty/error states, Contact confirmation, Projects details, QA filters/carousel/details, both themes, and the required responsive widths.

Keep the root and backend dependency installations separate. The root production build still produces the frontend `dist/` directory; it does not bundle the backend or database configuration. This work stops after **Phase 05**. Further testing expansion, a separate security-hardening phase, and deployment require the owner's next approval.
