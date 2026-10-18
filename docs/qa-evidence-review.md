# QA evidence and publication review

Review date: 18 October 2026.

## Source and attribution

The seven published QA case studies use the portfolio owner's explicitly supplied summaries of previous testing work. The owner authorised these summaries as the source material after confirming that the original PDFs were inaccessible. No original PDF text, screenshot, embedded configuration, or execution log was reviewed. The site labels this provenance and describes numerical results as previously recorded or historical.

The supplied QA Reports Drive folder showed no accessible files to the review browser. A recursive local search found zero PDFs under `reports-source/`; that directory contains JMeter program files. These program files are not evidence that particular workloads were executed. No source report or screenshot has been copied into `public/`, and the source Drive folder is not linked on the site.

The data in `src/data/qaReports.js` contains these seven owner-approved summaries:

1. Apache JMeter — TalentHub Performance Testing.
2. Playwright — MySLT Portal Automation.
3. REST Assured — API Checks with REST Assured.
4. Appium — Android Settings Automation & Troubleshooting.
5. SonarQube Community Build — Bell Pepper Monitor Static Analysis.
6. OWASP ZAP — Web Security Scanning & Alert Review.
7. Selenium WebDriver — Data-Driven Login Automation with Selenium.

The summaries preserve the supplied limits: JMeter testing-environment measurements without server monitoring; Playwright stopping before service submission; JSONPlaceholder's simulated writes; Appium execution failures; historical SonarQube figures with unresolved findings; scanner-generated ZAP alerts; and unsuccessful Facebook authentication in Selenium's expected-success cases. No private URLs, credentials, or test input values are included. The original Selenium report title supplied by the owner is `Selenium Automation for Facebook Login Testing [ID-3767].pdf`; that file was not available for inspection.

The summaries do not infer whether every exercise was personal, academic, or internship work. Only the supplied application or environment context is shown. The personal testing approach is not labelled as an official SLT process. Other tools remain in Skills & Tools without invented evidence cards.

## Record fields and link controls

| Field                         | Meaning                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `id`, `title`                 | Stable identifier and accurate case-study title                                           |
| `category`                    | `automation`, `api`, `performance`, `mobile`, `security`, or `analysis`                   |
| `primaryTool`, `technologies` | Primary tool name and supporting-technology array                                         |
| `context`                     | Confirmed application/environment; do not infer employment attribution                    |
| `summary`, `scope`, `result`  | Concise work, actual scope, and contextual historical result                              |
| `implementation`              | Array of supplied or source-verified activities and investigations                        |
| `limitations`, `sourceNote`   | Evidence limits and explicit provenance                                                   |
| `summaryApproved`             | `true` to publish the owner-approved summary                                              |
| `sourceReviewed`              | `true` only after the original report has been inspected; currently `false` for all seven |
| `reportUrl`                   | `null` until an approved public PDF or authorised HTTPS link exists                       |
| `publicReportApproved`        | `true` only for an inspected, sanitised, authorised public report                         |

Each card has a keyboard-accessible native **View Details** disclosure. All current records have `reportUrl: null`, `sourceReviewed: false`, and `publicReportApproved: false`; they display **Public report not available** without a fake button.

A **View Report** link requires source review and public approval. Local links additionally require an existing PDF with a valid header in `public/documents/qa-reports/`, using a lowercase hyphenated filename. Vite checks local file availability at startup/build. Restart the development server or rebuild after adding/removing an approved report. Existence and a PDF signature do not establish sanitisation or authorisation; those require a separate editorial review. Authorised HTTPS links open with `target="_blank"` and `rel="noopener noreferrer"`.

## Original reports and future public copies

Originals may be stored under `reports-source/`. That folder is ignored by Git, ESLint, and Prettier and denied by the Vite development file server. Local PDF review intermediates belong under `tmp/pdfs/`, also ignored and blocked. Neither is imported into the frontend. Everything placed in `public/` is distributed by the build; an ignore rule alone does not make an asset private.

No specific redaction findings can be asserted without the originals. No PDF redaction or public-copy authoring has been performed. Before publishing a report:

- Inspect relevant pages visually as well as extracting text; include screenshots, tables, examples, annotations, metadata, and embedded files.
- Check for credentials, API keys, session cookies, authentication tokens, personal data, internal URLs, identifiable organisational traffic, and restricted security findings. Produce a sanitised copy and verify its rendered pages and extracted text.
- Obtain explicit public-sharing authorisation for organisational material, particularly the security report. A source-folder link is not approval to publish its contents.
- Verify results and distinguish executed, planned, failed, and unverified checks. Preserve limitations and historical context. Do not silently upgrade these owner-supplied summaries into independently verified PDF findings.
