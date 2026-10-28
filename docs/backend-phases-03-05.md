# Backend Phases 03–05: implementation and local verification

Implemented in the existing React/Vite and Express/MySQL architecture. Contact was implemented and checked before Projects; Projects was checked before QA Evidence. No admin dashboard, project/evidence write API, deployment, commit, or push was added.

## Files

New backend feature files:

```text
backend/src/config/smtp.js
backend/src/middleware/apiError.js
backend/src/middleware/contactRateLimit.js
backend/src/validators/contactValidation.js
backend/src/validators/catalogueValidation.js
backend/src/controllers/contactController.js
backend/src/controllers/projectController.js
backend/src/controllers/qaEvidenceController.js
backend/src/services/contactService.js
backend/src/services/emailService.js
backend/src/services/projectService.js
backend/src/services/projectMigrationService.js
backend/src/services/qaEvidenceService.js
backend/src/services/qaMigrationService.js
backend/src/routes/contactRoutes.js
backend/src/routes/projectRoutes.js
backend/src/routes/qaEvidenceRoutes.js
backend/scripts/initialize-database.js
backend/scripts/migrate-projects.js
backend/scripts/migrate-qa-evidence.js
backend/database/migrations/005-qa-approval.sql
backend/tests/contact.test.js
backend/tests/projects.test.js
backend/tests/project-migration.test.js
backend/tests/qa-evidence.test.js
backend/tests/qa-migration.test.js
```

Updated backend files: `src/app.js`, `src/routes/index.js`, `src/middleware/cors.js`, `src/middleware/errorHandler.js`, `tests/app.test.js`, `.env.example`, `package.json`, `package-lock.json`, and `README.md`. The existing route-absence tests now check unsupported methods on the authorized endpoints; health, CORS, safe-error tests, and the earlier frontend regression tests remain in place.

New frontend feature files:

```text
.env.example
src/components/ui/ContactForm.jsx
src/components/ui/ApiCollectionState.jsx
src/hooks/useApiCollection.js
src/utils/api.js
src/utils/contact.js
src/utils/catalogue.js
src/styles/contact-form.css
src/styles/api-state.css
tests/api-contact.test.js
tests/api-collection.test.js
tests/api-qa.test.js
```

Updated frontend files: the existing `Contact.jsx`, `Projects.jsx`, and `QaEvidence.jsx` sections, plus the Contact grid's row spacing in `src/styles/index.css`. The original source data, project cards/dialog markup, QA cards/carousel/hook, Skills, theme system, and motion utilities were retained. The root README now describes API-backed content. Earlier Phase 01–02 workspace changes were preserved.

Nodemailer is the only new runtime dependency in these phases. There are no new frontend or test dependencies.

## Endpoints

| Method | Path                   | Behavior                                                             |
| ------ | ---------------------- | -------------------------------------------------------------------- |
| POST   | `/api/contact`         | Validate, store a message, then attempt notification                 |
| GET    | `/api/projects`        | Published projects, category filter, pagination                      |
| GET    | `/api/projects/:id`    | One published project by numeric-string ID                           |
| GET    | `/api/qa-evidence`     | Approved public summaries, category/tool/context filters, pagination |
| GET    | `/api/qa-evidence/:id` | One approved public record by numeric-string ID                      |

The existing `/api/health` remains available. Full request/response examples and exact PowerShell setup commands are in [backend/README.md](../backend/README.md).

List responses use `{ data, pagination: { page, pageSize, total, totalPages } }`. Detail responses use `{ data }`. Unknown query keys and invalid IDs return 400; private/missing records return 404; unavailable databases return a sanitized 503. No raw driver errors are returned.

Featured-project filtering is intentionally unsupported: the source and existing schema have no featured metadata. QA has no project relationship; its `context` filter is explicitly a descriptive label, not an invented project ID. Unsupported `featured` or `project` parameters return 400.

## Database and content preservation

The configured database was reachable but initially had no tables. The existing Phase 02 schema was initialized using `db:init`; no pre-existing table or record was dropped.

- Project migration inserted the four original public case studies. All 17 mapped database fields and all API presentation fields were compared with the original data, including notes, arrays, dates, assets, and null links.
- QA migration added only `summary_approved`, `source_reviewed`, and `public_report_approved`, each defaulting to false, plus CHECK constraints. Existing unknown records are not automatically approved.
- QA migration inserted all nine approved source records. Exact comparison preserved all summaries, scope, results, implementations, limitations, source notes, URLs, and flags. The seven owner-supplied summaries remain unreviewed against original PDFs; BrowserStack and Allure retain reviewed-source flags.
- Repeated migrations inserted zero records, preserved four projects/nine QA records, made zero further schema changes, and reported no approval/content conflicts.
- Data imports use transactions and insert missing slugs only. Existing edits, drafts, and publication states are preserved. MySQL DDL commits implicitly, so additive schema changes finish before the data transaction; the guarded runner supports reruns and partial setup.
- A browser-created Contact verification message was confirmed in MySQL with status `new`; only that newly created verification fixture was removed afterward.

The original data modules remain migration inputs, not a silent fallback when API reads fail. Updating an existing database record is a deliberate operator action; repeat imports do not overwrite it.

## Configuration

Existing database variables remain in the ignored `backend/.env`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

Notification settings requiring manual provider configuration are `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `SMTP_TO`. Real SMTP delivery was not tested. Unit tests mock transport, and the live browser verified the honest saved-but-notification-unavailable response while SMTP was unconfigured.

`FRONTEND_ORIGIN` must match the actual browser origin. `VITE_API_BASE_URL` is public frontend configuration only: development defaults to `http://127.0.0.1:3001`; an unconfigured production build uses same-origin API paths. No backend is deployed by this work. Database and SMTP credentials must never use the `VITE_` prefix.

The local Contact limiter is bounded, per-process memory: five requests per IP per 15 minutes. A later serverless deployment must configure a suitable shared store and trusted-proxy handling. The app export does not open a persistent listener; local startup remains in `server.js`.

## Checks performed

| Check                             | Actual result                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| Backend test suite                | 79 passed, 0 failed                                                                           |
| Frontend test suite               | 51 passed, 0 failed; original 20 retained                                                     |
| Root lint                         | Passed                                                                                        |
| Formatting check                  | Passed                                                                                        |
| Frontend production build         | Passed                                                                                        |
| MySQL connection check            | `SELECT 1` succeeded                                                                          |
| Repeated content migrations       | 0 inserted; 4 projects and 9 QA records preserved                                             |
| Public catalogue parity           | All original project/QA content and approved links matched                                    |
| Runtime SQL                       | Server-prepared queries, including filters, IDs, and pagination bindings                      |
| Deliberate database/SMTP failures | Safe responses; no credentials/SQL/stack leakage; saved messages survive notification failure |

These tests cover the requested features and migrations, not a separate testing or security-hardening phase.

## Actual browser verification

Inspected the running local application with the real APIs and database:

- Contact: client errors/focus, pending state, disabled duplicate submissions, exactly one request, confirmed saved response, cleared values after save, and preserved values/no false success on a simulated unavailable API.
- Projects: four API-loaded cards and original images; filter counts 4/1/3; QuickJob dialog copy and Escape close; controlled loading, empty, error, and successful retry states.
- QA: nine unique cards and nine approved report links; all filters (9/2/1/1/1/1/1/2); automatic scrolling, stationary pause, resume, next-arrow navigation, 150px mouse dragging, and complete contained View Details content. Retry mounts a fresh carousel with all nine records.
- Both themes at widths 320, 375, 768, 1024, and 1440: no horizontal page overflow; eight Skills groups; unchanged contact-row alignment; responsive one/two-column form fields; four projects and nine QA cards.
- Saved Light Mode survived reload; original Dark Mode preference was restored after verification.
- Mobile menu opened and closed with Escape and restored focus. Every form field and submit button remained reachable with visible keyboard focus.
- Reduced motion disabled automatic QA scrolling and retained all nine cards plus navigation arrows.

Temporary browser failure/timing probes were removed. These checks do not claim that third-party Google Drive files were opened or that recorded QA findings were independently rerun.

Native touchscreen swiping still needs a physical-device check. Mobile overflow/layout and desktop dragging/navigation were checked; the existing native touch-scrolling implementation is unchanged.

## Final verification follow-up — 28 October 2026

The complete backend suite (79 tests), frontend suite (51 tests), formatting, lint, and production build were rerun. The real MySQL connection check passed again. Both themes were rechecked at all five requested widths: 320, 375, 768, 1024, and 1440 pixels. Every measurement retained four projects, nine QA records/report links, eight skill groups, nine certifications, and twelve videos, with zero horizontal page overflow. No browser console warnings or errors were captured during the clean-page check.

One form accessibility issue was found and fixed: a server validation response could attempt to focus an input while its fieldset was still disabled. Error focus now runs after React re-enables the form. The browser verified a server-rejected email address: the email field received focus, its error was associated through `aria-describedby`, and entered values were retained. Client validation, sequential keyboard focus, mobile-menu Escape/focus restoration, project-dialog focus containment/restoration, and certificate-dialog Escape were also checked.

Reduced motion was checked in both themes: running animations stopped, reveal content remained visible, smooth scrolling became automatic/instant, and QA autoplay controls were removed while arrows and all nine records remained usable. Saved Light and Dark preferences survived reload; Dark was restored after testing. The CV returned HTTP 200 with a valid PDF header. QA report links retain `target="_blank"` and `rel="noopener noreferrer"`; this does not verify the contents or sharing permissions of third-party reports.

The root README's local browser URL was corrected to match the CORS origin. It now also explains API configuration for a production preview. The backend README already includes the remaining MySQL initialization, migrations, least-privilege runtime account, SMTP settings, and two-terminal startup steps.

The code is ready for review before a GitHub push. The full-stack application is **not ready for a direct Vercel deployment**: deployment entry/routing, hosted MySQL connectivity/TLS and connection limits, production API/CORS values, shared rate limiting/proxy handling, and SMTP provider configuration/real delivery verification remain future setup. No deployment changes were made. Local SMTP remains unconfigured; saving a Contact message works, with an honest notification-unavailable acknowledgement.

Detailed measurements and logs are saved in `artifacts/backend-phases-03-05-browser.json`, `artifacts/backend-final-tests.log`, `artifacts/frontend-final-tests.log`, and `artifacts/frontend-final-build.log`. Screenshot artifacts include `verification-contact-dark-375.png`, `verification-skills-light-1440.png`, and `verification-qa-dark-1440.png`. Temporary browser viewport and media overrides are reset after verification.

Screenshots and detailed measurement output are in the Git-ignored `artifacts/` directory. No commit, push, hosting configuration, or deployment was performed. Work stops after Phase 05.
