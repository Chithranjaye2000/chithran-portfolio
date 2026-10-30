# Single-project Vercel Services and Preview verification

Updated on 30 October 2026. The owner reports that the Services Preview is Ready. This local update performs **no commit, push, deployment, project link, environment upload, or Vercel setting change**. The existing production project and domain remain untouched.

## Current data-source decision and remaining Contact verification

The owner now requires **static frontend data** for Projects and QA Evidence. `src/components/sections/Projects.jsx` reads all **4 Projects** directly from `src/data/portfolio.js`; `QaEvidence.jsx` reads all **9 approved QA entries** directly from `src/data/qaReports.js`. The source records are unchanged. Filters, project dialogs, QA disclosures/report links, and carousel behavior are retained. Neither section requests `/api/projects` or `/api/qa-evidence`.

The previous display errors arose because both sections required successful catalogue API requests, while the reported Preview requests returned HTTP 503. Those endpoints still depend on the primary MySQL pool, configured locally on the laptop; this inspection did not read Preview secrets to determine its specific connection/configuration error. Static rendering removes that browser dependency explicitly; it is not a fallback presented as a successful API response. Backend catalogue endpoints and local records remain intact for optional local use. Do not migrate the 4 Projects, 9 QA entries, or historical Contact message, repoint their pool to Aiven, or expose the laptop database publicly.

The latest owner-supplied Contact trace is **POST `/api/contact`, no redirect, pending until timeout**, on commit `683d01a`. That trace does not establish that the current request reaches `notFound`; the earlier JSON 404 report and this timeout must be distinguished. The checked-out Express route is registered correctly and local route tests reach its controller. Read-only external probes to the supplied Preview are redirected to Vercel Authentication, so the hosted handler and timeout stage cannot yet be verified. Do not claim a deployed routing fix or SMTP delivery from local tests. Obtain a sanitized runtime/request trace before changing prefixes, credentials, or security controls.

## Verified configuration

Vercel's current Services configuration is supported and remains **Beta**. The earlier `experimentalServices` model is not used. Services are independently built within one deployment; public rules choose a service in order. See [Services](https://vercel.com/docs/services), [configuration reference](https://vercel.com/docs/services/config-reference), and [routing](https://vercel.com/docs/services/routing).

The final root `vercel.json` is:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "app": {
      "root": ".",
      "framework": "vite",
      "installCommand": "npm ci --include=dev",
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    },
    "backend": {
      "root": "backend",
      "framework": "express",
      "entrypoint": "src/app.js",
      "installCommand": "npm ci"
    }
  },
  "rewrites": [
    { "source": "/api", "destination": { "service": "backend" } },
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "app" } }
  ]
}
```

The backend receives the original `/api/...` path. Express already mounts its router at `/api`; no prefix is stripped or added. Bare `/api`, unknown API routes, and duplicated `/api/api/...` routes return backend JSON 404s instead of frontend HTML. The app-scoped fallback supports SPA deep links; existing static assets and the CV must also be checked on the eventual Preview build.

`backend/src/app.js` exports the Express handler without starting a listener, database pool, or SMTP transport. It is the explicit production entry. `backend/src/server.js` retains localhost startup and shutdown for the existing two-terminal local workflow; production does not invoke it. The app install explicitly includes dev dependencies so Vite and its plugin are available even with project-wide `NODE_ENV=production`. No adapter, new framework, dependency, schema change, or data migration was added.

## Complete Vercel environment checklist

Use **the existing Vercel project's** environment settings only after approval. Select Production and Preview scopes deliberately. Services share project environment settings; do not assume the Vite build process cannot see server variables. Only `VITE_*` values are intended for the browser, and no database/SMTP credential may use that prefix.

### Required Contact/backend configuration

| Variable                     | Classification                             | Production value                                                       |
| ---------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `NODE_ENV`                   | Server configuration                       | `production`                                                           |
| `FRONTEND_ORIGIN`            | Public origin, server configuration        | Exact existing frontend HTTPS origin, no path/wildcard                 |
| `CONTACT_DB_HOST`            | Server-only connection metadata            | Exact Aiven DNS hostname, not a URL or IP                              |
| `CONTACT_DB_PORT`            | Server-only connection metadata            | Aiven service port                                                     |
| `CONTACT_DB_NAME`            | Server-only connection metadata            | Existing database containing `contact_messages`                        |
| `CONTACT_DB_USER`            | Server-only account metadata               | Prefer a restricted Contact runtime user                               |
| `CONTACT_DB_PASSWORD`        | **Secret**                                 | That account's password                                                |
| `CONTACT_DB_SSL_ENABLED`     | Server configuration                       | `true`                                                                 |
| `CONTACT_DB_SSL_CA`          | **CA certificate**, backend trust material | Full downloaded PEM CA/bundle, real newlines or supported literal `\n` |
| `CONTACT_DB_SSL_CA_PATH`     | Optional server configuration              | **Unset/empty** when using inline CA; never a workstation Windows path |
| `SMTP_HOST`                  | Server configuration                       | `smtp.gmail.com` for Gmail                                             |
| `SMTP_PORT`                  | Server configuration                       | `465`                                                                  |
| `SMTP_SECURE`                | Server configuration                       | `true` with 465; alternatively 587/false with required STARTTLS        |
| `SMTP_USER`                  | Private server/account setting             | Authenticated Gmail sender address                                     |
| `SMTP_PASSWORD`              | **Secret**                                 | Google App Password, never the regular Gmail password                  |
| `SMTP_FROM`                  | Optional private server setting            | Defaults to Gmail sender; if set for Gmail, must match `SMTP_USER`     |
| `CONTACT_NOTIFICATION_EMAIL` | Private server setting                     | Your explicitly chosen recipient inbox                                 |

Do not configure legacy `SMTP_TO` in place of the required production recipient. Do not use `DB_*` in place of `CONTACT_DB_*`. SSL certificate and hostname verification remain enabled; the missing/invalid Contact configuration fails closed instead of using local MySQL. The Contact INSERT finishes before SMTP is attempted; SMTP failure retains the saved row and returns an honest saved-but-notification-unavailable response.

Configure Preview credentials/recipient separately if test submissions should not reach the production Contact database or inbox. This preparation did not create another database or send any email. The earlier local Gmail test established SMTP acceptance, not independently verified inbox delivery.

### Frontend public configuration

For the requested same-domain Services setup, leave **both `VITE_API_BASE_URL` and `VITE_CONTACT_API_BASE_URL` unset or empty** in Production and Preview. Browser requests then use the deployment's own `/api/...` ingress. Do not copy the local `.env.example` localhost URL into Vercel. Do not include `/api` in either base URL; request paths already include it.

No new frontend variable is needed. Projects/QA now use their existing static data modules and do not consume an API base. The existing Contact-specific override remains available for local testing or an explicitly approved separate API origin; same-origin Services should leave it empty.

### Vercel-generated values

Enable **access to System Environment Variables** in the existing project's environment settings before Preview validation. Let Vercel supply `VERCEL=1`, `VERCEL_URL`, and `VERCEL_BRANCH_URL`; do not manually hardcode these. These hostnames are not credentials. The backend adds only their exact validated HTTPS origins to CORS when the trusted runtime flag is present. It retains the configured production origin and rejects unrelated origins, arbitrary Host headers, wildcards, IPs, ports, and malformed metadata. [System variable reference](https://vercel.com/docs/environment-variables/system-environment-variables)

`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_ENV`, and `PORT` are not additional required application inputs for this implementation. `PORT` is for the local listener; the production handler does not bind a port. No private service binding is needed for browser calls through the public same-origin route table.

### Optional catalogue APIs — not required by the frontend

The retained Projects/QA endpoints still use the primary `DB_*` pool if explicitly called. The portfolio no longer calls them, so **`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_ENABLED`, `DB_SSL_CA`, and `DB_SSL_CA_PATH` are not required for the deployed frontend or Contact API**. Keep the working local `.env` unchanged. Without an independently configured reachable catalogue database, manually calling those endpoints on Vercel may still return a safe 503; that does not prevent static cards from rendering. Do not configure them with Contact-only Aiven credentials or run catalogue migration commands. Contact exclusively uses `CONTACT_DB_*` with verified SSL.

## Security and local behavior

- Current tracked file-name inspection found no private environment files, cryptographic CA/key files, registry auth files, or Vercel link metadata. Safe `.env.example` templates remain tracked.
- `.gitignore` now also covers `.vercel/` and certificate/key extensions at repository level. Existing `.env`, `.env.aiven`, `.env.smtp`, and configured CA exclusions remain intact.
- `.vercelignore` explicitly excludes local environment files, certificates/keys, link metadata, artifacts, private reports, temporary files, dependencies, and old build output. Both service source trees, package/lock files, public assets, and safe templates remain upload inputs. It does not exclude the backend directory. [Vercel upload exclusions](https://vercel.com/docs/deployments/vercel-ignore)
- Vite still publishes only its built `dist` assets. Its existing development deny rules block backend and private configuration files. No secrets or certificate contents were printed, copied into frontend code, or uploaded.
- The memory limiter remains per warm instance. Before a public launch, configure an enforcing WAF/shared rate limit for POST `/api/contact`; retain trusted platform-IP handling and existing validation/body limits. Account for five Contact connections per warm instance plus any separately configured catalogue pool, function concurrency, and SMTP timeouts.
- Existing `npm run dev` commands, local environment files, primary database pool, Aiven Contact pool, Gmail configuration, themes, styles, animations, assets, and content remain unchanged. No live database or SMTP writes were made in this preparation.

## Current local verification — 30 October 2026

| Check                  | Actual result                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend `npm test`     | 153 passed, 0 failed                                                                                                                                                                          |
| Frontend `npm test`    | 62 passed, 0 failed                                                                                                                                                                           |
| `npm run format:check` | Passed                                                                                                                                                                                        |
| `npm run lint`         | Passed, zero warnings                                                                                                                                                                         |
| `npm run build`        | Passed                                                                                                                                                                                        |
| Source preservation    | Both original static data files unchanged; all 4 Projects and 9 QA entries retained                                                                                                           |
| Built client           | Contains `/api/contact`; contains neither catalogue endpoint path                                                                                                                             |
| Browser network        | Fresh local page load: 88 captured requests, no catalogue API calls, no truncated events                                                                                                      |
| Responsive themes      | 320, 375, 768, 1024, and 1440 pixels in Light and Dark: 4/9 cards and no horizontal page overflow                                                                                             |
| Interactions           | Project filters produce 1 research / 3 web cards; project dialog opens and Escape closes; all QA filters match their records; keyboard details expand and pause reading; carousel arrows work |
| Reduced motion         | Emulation shows automatic scrolling disabled and all content retained; emulation and viewport reset afterward, Dark theme restored                                                            |
| Contact entrypoint     | Actual configured default export reaches validation with HTTP 422; injected asynchronous save/notification path returns 201 in local and production-like routing tests                        |
| Hosted Contact         | Unresolved: owner reports pending POST/timeout; read-only GET probes redirected to authentication, whose browser access was not approved                                                      |

The new tests are `tests/static-catalogues.test.js` and `backend/tests/vercel-contact-path.test.js`. Local Services tests inspect the real configuration and entrypoint but do not emulate Vercel's deployed ingress. Database and SMTP operations in tests are mocked. No hosted POST, live message, database migration/write, or deployment change was made. `vercel.json` and backend application/routing/configuration files are unchanged because no source routing defect was reproduced. Existing Aiven certificate/hostname verification and Gmail notification handling are preserved. The reported separate `NOT_FOUND` response has not been tied to the pending POST; its source remains unconfirmed without runtime evidence.

Local browser screenshots are in the ignored `artifacts/static-qa-preview-desktop.png` and `artifacts/static-qa-preview-mobile.png` files. They are verification artifacts, not public portfolio assets.

## Historical Services preparation validation

These are the earlier preparation results, not the current change's final test counts or hosted Preview verification. Rerun the commands and report current results separately.

| Check                     | Actual result                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend tests             | 149 passed, 0 failed                                                                                                                                        |
| Frontend tests            | 58 passed, 0 failed                                                                                                                                         |
| Root lint                 | Passed                                                                                                                                                      |
| Production frontend build | Passed; same frontend JS/CSS asset hashes as before this preparation                                                                                        |
| Configuration schema      | Data validation passed against Vercel's downloaded public JSON schema                                                                                       |
| Routing contracts         | API prefix/query retention, Contact save-before-notify through mocks, JSON 404 ownership, catalogue field/approval retention, assets/CV, SPA routing passed |
| Serverless import         | No listener, pool, transport, or private-file read in guarded import probe                                                                                  |
| CORS                      | Exact production/Preview/branch allowlist and spoof/malformed-origin rejections passed                                                                      |
| Upload exclusions         | Required inputs retained; representative private paths excluded                                                                                             |

Official-schema validation used the installed AJV dependency as an inspection tool, not a new application dependency. The upstream schema mixes draft declarations/keywords, so schema self-validation was disabled while configuration-data validation still ran. This is not a hosted Vercel build result. Local routing tests use a documented contract harness, not a Vercel CDN emulator. The guarded import probe stubs the environment-file loader; the real module still attempts to load local `.env` and safely handles its absence on the host. No installed Vercel CLI or cloud build was used; actual Services detection, asset serving, production environment values, and runtime behavior require the approved Preview test.

## Historical Services preparation files

- `vercel.json`: format/verify the supplied file, explicit app build/output, app SPA fallback, explicit Express app entry, bare `/api` ownership.
- `.gitignore`, `.vercelignore`, `.prettierignore`, `eslint.config.js`, `vite.config.js`: protect private upload inputs, keep generated Vercel files out of checks, and block Vercel metadata through the local Vite file server.
- `backend/src/config/environment.js`, `backend/src/middleware/cors.js`, `backend/src/app.js`: exact trusted deployment-origin support; no global wildcard/proxy trust.
- `backend/tests/vercel-cors.test.js`, `backend/tests/vercel-serverless.test.js`, `tests/vercel-routing.test.js`: focused routing, import, CORS, and regression coverage.
- `.env.example`, `backend/.env.example`: clarify local-only API URLs, same-origin Services settings, and platform-supplied metadata; placeholders only.
- `README.md`, `backend/README.md`, `docs/contact-production-setup.md`, this document: single-project preparation superseded the earlier separate-Contact-project recommendation. The newer static frontend decision above supersedes the old catalogue release gate.

## Exact Git commands — review first, do not run push yet

Current branch at inspection: `preview/vercel-services`, commit `683d01a`. Existing remote: `https://github.com/Chithranjaye2000/chithran-portfolio.git`. Do not create a repository or change its remote. The commands below are future review steps and were **not executed**. Inspect current changes before staging, including any additional Contact regression-test file reported by this change. Pushing this branch can itself start a Preview deployment; pushing `main` can start production deployment. Push remains deferred until the owner approves.

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
git status --short
git branch --show-current
git add -- src/components/sections/Projects.jsx src/components/sections/QaEvidence.jsx tests/static-catalogues.test.js backend/tests/vercel-contact-path.test.js .env.example README.md backend/README.md docs/contact-production-setup.md docs/vercel-services-deployment.md
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
git commit -m "Use static frontend portfolio catalogues"
```

Only after the owner approves a remote push/Preview build and checks automatic deployment settings:

```powershell
git push -u origin preview/vercel-services
```

Do not use `git add .`, stage private environment files/certificates, or push the production branch as part of this preparation.

## Deployment procedure after approval

1. Keep the current production deployment active while resolving the remaining Contact Preview trace. Record its deployment, connected repository/production branch, domains, and settings privately as a rollback baseline. Keep the same project, root `.`, and existing domains; do not delete/recreate the project or repository. Projects/QA use static data and require no cloud catalogue migration.
2. Review automatic deployments before pushing anything. A push can initiate a build. After approval, use a feature-branch Preview, never direct production promotion. If changing project settings is needed, make those changes only after separate confirmation. Services is Beta; confirm the existing project/account UI accepts it. If the current dashboard offers or requires a Services framework preset, select it only after confirmation; the app service itself remains `framework: "vite"`. Do not blindly add a top-level `framework: "services"` key or copy the old `experimentalServices` model.
3. Add the environment values in the existing project UI, using the correct Production/Preview scope and system-variable access. Use inline Contact CA text, not a local path. Preserve existing secrets outside Git. Do not change live catalogue data or run schema/seed commands during a build.
4. Ensure build logs detect **both** configured services: root Vite app and backend Express handler. Service-local install/build/output fields are in the checked-in file; legacy single-app project overrides may need review. If only the Vite service builds, stop and resolve Services detection instead of promoting. Choose a currently supported Node 22.x runtime matching the tested major and review function durations/connection budgets.
5. On the Preview URL, check `/`, static JS/CSS, profile image, certificate images, `/documents/Chithran-CV.pdf`, direct SPA paths, `/api/health`, `/api` and unknown API JSON 404s, CORS, both themes/mobile menu, and all 4 Projects/9 QA cards/details/filters/carousel. Browser Network must show **no `/api/projects` or `/api/qa-evidence` requests**. Do not require those optional endpoints to succeed or migrate them to make this check pass. Health alone does not verify Contact readiness. Any diagnostic POST, including validation probes, needs authorization under the current read-only Preview restriction.
6. With explicit permission for real test messages, submit one labelled Contact test, confirm it saves only to Aiven, check SMTP acceptance, and independently verify receipt in the intended inbox. Preview tests against production secrets create real messages/send real notifications; they are not automatically disposable. Preserve saved messages even if email fails.
7. Review the Preview results, security/rate-limit settings, unchanged data counts, and rollback plan with the owner. Obtain final production-promotion confirmation. Only then deploy/promote in the existing project and recheck the same journey on the existing domain. If validation fails, keep or restore the prior deployment; do not delete records or blindly switch databases. Any new Contact writes must survive rollback.

Nothing in this document authorizes deployment. Work stops at preparation and local verification.
