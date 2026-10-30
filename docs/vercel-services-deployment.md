# Single-project Vercel Services preparation

Prepared on 28 October 2026. **No commit, push, deployment, project link, environment upload, or Vercel setting change was performed.** The live frontend project and domain were not changed.

## Current decision and release blocker

The owner chose to **preserve the existing Projects and QA integrations and document the blocker**. Those endpoints read the primary `DB_*` MySQL pool, currently backed by local MySQL. A function running on Vercel cannot reach the laptop's `127.0.0.1`. Aiven intentionally contains only Contact data, not Projects or QA tables.

Therefore, this is validated deployment preparation, **not approval to promote the full portfolio**. Same-origin `/api/projects` and `/api/qa-evidence` cannot work on Vercel until an approved reachable catalogue database/API is supplied. Do not set their `DB_*` values to the Contact database, silently introduce static fallback, copy the 4 Projects or 9 QA records, expose the laptop database publicly, or move the historical Contact message.

The simplest safe action now is to keep the current production deployment active and hold promotion. If Services is unavailable or unsuitable for the existing project, the alternative is to retain the frontend project and prepare a separate Contact backend project with the existing Contact-only public API override. That still requires explicit deployment approval and does not itself make the local catalogue remotely reachable. Any future repository-backed catalogue option changes the data-source policy and needs separate approval.

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

No new frontend variable name or UI change was introduced in this task. Existing catalogue requests and data modules are unchanged. An approved external catalogue API would require a separately reviewed public-base choice, while keeping Contact same-origin through its existing override; that is not configured here.

### Vercel-generated values

Enable **access to System Environment Variables** in the existing project's environment settings before Preview validation. Let Vercel supply `VERCEL=1`, `VERCEL_URL`, and `VERCEL_BRANCH_URL`; do not manually hardcode these. These hostnames are not credentials. The backend adds only their exact validated HTTPS origins to CORS when the trusted runtime flag is present. It retains the configured production origin and rejects unrelated origins, arbitrary Host headers, wildcards, IPs, ports, and malformed metadata. [System variable reference](https://vercel.com/docs/environment-variables/system-environment-variables)

`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_ENV`, and `PORT` are not additional required application inputs for this implementation. `PORT` is for the local listener; the production handler does not bind a port. No private service binding is needed for browser calls through the public same-origin route table.

### Catalogue configuration — unresolved release gate

The current Projects/QA pool still uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_ENABLED`, and exactly one of `DB_SSL_CA` or `DB_SSL_CA_PATH`. Production requires `DB_SSL_ENABLED=true` and a valid CA. A production configuration must point to an **approved reachable existing catalogue source**. Its credentials are secrets and must remain server-side. A local address is not a valid Vercel destination; Aiven Contact-only credentials do not supply the missing tables. No such replacement source has been approved, so this checklist item is intentionally unresolved.

## Security and local behavior

- Current tracked file-name inspection found no private environment files, cryptographic CA/key files, registry auth files, or Vercel link metadata. Safe `.env.example` templates remain tracked.
- `.gitignore` now also covers `.vercel/` and certificate/key extensions at repository level. Existing `.env`, `.env.aiven`, `.env.smtp`, and configured CA exclusions remain intact.
- `.vercelignore` explicitly excludes local environment files, certificates/keys, link metadata, artifacts, private reports, temporary files, dependencies, and old build output. Both service source trees, package/lock files, public assets, and safe templates remain upload inputs. It does not exclude the backend directory. [Vercel upload exclusions](https://vercel.com/docs/deployments/vercel-ignore)
- Vite still publishes only its built `dist` assets. Its existing development deny rules block backend and private configuration files. No secrets or certificate contents were printed, copied into frontend code, or uploaded.
- The memory limiter remains per warm instance. Before a public launch, configure an enforcing WAF/shared rate limit for POST `/api/contact`; retain trusted platform-IP handling and existing validation/body limits. Account for five Contact connections per warm instance plus any separately configured catalogue pool, function concurrency, and SMTP timeouts.
- Existing `npm run dev` commands, local environment files, primary database pool, Aiven Contact pool, Gmail configuration, themes, styles, animations, assets, and content remain unchanged. No live database or SMTP writes were made in this preparation.

## Validation performed

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

## Files changed

- `vercel.json`: format/verify the supplied file, explicit app build/output, app SPA fallback, explicit Express app entry, bare `/api` ownership.
- `.gitignore`, `.vercelignore`, `.prettierignore`, `eslint.config.js`, `vite.config.js`: protect private upload inputs, keep generated Vercel files out of checks, and block Vercel metadata through the local Vite file server.
- `backend/src/config/environment.js`, `backend/src/middleware/cors.js`, `backend/src/app.js`: exact trusted deployment-origin support; no global wildcard/proxy trust.
- `backend/tests/vercel-cors.test.js`, `backend/tests/vercel-serverless.test.js`, `tests/vercel-routing.test.js`: focused routing, import, CORS, and regression coverage.
- `.env.example`, `backend/.env.example`: clarify local-only API URLs, same-origin Services settings, and platform-supplied metadata; placeholders only.
- `README.md`, `backend/README.md`, `docs/contact-production-setup.md`, this document: current single-project preparation supersedes the earlier separate-Contact-project recommendation while retaining the unresolved catalogue gate.

## Exact Git commands — review first, do not run push yet

Current branch at inspection: `main`. Existing remote: `https://github.com/Chithranjaye2000/chithran-portfolio.git`. Do not create a repository or change its remote. The commands below prepare a feature branch; they were **not executed**. Inspect any new user changes before staging. Pushing a branch connected to Vercel can itself start a Preview deployment; pushing `main` can start production deployment. Therefore the push command is deferred until deployment approval and automatic-deployment behavior have been reviewed.

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
git status --short
git switch -c codex/vercel-services
git add -- vercel.json .gitignore .vercelignore .prettierignore eslint.config.js vite.config.js .env.example README.md backend/.env.example backend/README.md backend/src/app.js backend/src/config/environment.js backend/src/middleware/cors.js backend/tests/vercel-cors.test.js backend/tests/vercel-serverless.test.js tests/vercel-routing.test.js docs/contact-production-setup.md docs/vercel-services-deployment.md
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
git commit -m "Prepare single-project Vercel Services routing"
```

Only after the owner approves a remote push/Preview build and checks automatic deployment settings:

```powershell
git push -u origin codex/vercel-services
```

Do not use `git add .`, stage private environment files/certificates, or push the production branch as part of this preparation.

## Deployment procedure after approval

1. Resolve the catalogue release gate first, or explicitly keep this as non-promotable preparation. Record the currently active Vercel deployment, project ID, connected repository/production branch, domains, and build settings privately as a rollback baseline. Keep the same project, root `.`, and existing domains; do not delete/recreate the project or create a new repository.
2. Review automatic deployments before pushing anything. A push can initiate a build. After approval, use a feature-branch Preview, never direct production promotion. If changing project settings is needed, make those changes only after separate confirmation. Services is Beta; confirm the existing project/account UI accepts it. If the current dashboard offers or requires a Services framework preset, select it only after confirmation; the app service itself remains `framework: "vite"`. Do not blindly add a top-level `framework: "services"` key or copy the old `experimentalServices` model.
3. Add the environment values in the existing project UI, using the correct Production/Preview scope and system-variable access. Use inline Contact CA text, not a local path. Preserve existing secrets outside Git. Do not change live catalogue data or run schema/seed commands during a build.
4. Ensure build logs detect **both** configured services: root Vite app and backend Express handler. Service-local install/build/output fields are in the checked-in file; legacy single-app project overrides may need review. If only the Vite service builds, stop and resolve Services detection instead of promoting. Choose a currently supported Node 22.x runtime matching the tested major and review function durations/connection budgets.
5. On the Preview URL, check `/`, static JS/CSS, profile image, certificate images, `/documents/Chithran-CV.pdf`, direct SPA paths, `/api/health`, `/api` and unknown API JSON 404s, validation, CORS, both themes/mobile menu, and all Projects/QA cards/details/filters/carousel. `/api/projects` and `/api/qa-evidence` must both succeed from the approved data source; health alone is not readiness.
6. With explicit permission for real test messages, submit one labelled Contact test, confirm it saves only to Aiven, check SMTP acceptance, and independently verify receipt in the intended inbox. Preview tests against production secrets create real messages/send real notifications; they are not automatically disposable. Preserve saved messages even if email fails.
7. Review the Preview results, security/rate-limit settings, unchanged data counts, and rollback plan with the owner. Obtain final production-promotion confirmation. Only then deploy/promote in the existing project and recheck the same journey on the existing domain. If validation fails, keep or restore the prior deployment; do not delete records or blindly switch databases. Any new Contact writes must survive rollback.

Nothing in this document authorizes deployment. Work stops at preparation and local verification.
