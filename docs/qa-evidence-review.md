# QA evidence and publication review

Summary review date: 18 October 2026. Owner-supplied report links added: 20 October 2026.

## Source and attribution

The seven original QA case studies use the portfolio owner's explicitly supplied summaries of previous testing work. The owner authorised these summaries as the source material after confirming that their original PDFs were inaccessible. No original PDF text, screenshot, embedded configuration, or execution log was reviewed for those seven cards. The site labels this provenance and describes numerical results as previously recorded or historical.

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

The summaries do not infer whether every exercise was personal, academic, or internship work. Only the supplied application or environment context is shown. The personal testing approach is not labelled as an official SLT process.

On 20 October 2026, the owner supplied nine individual Google Drive URLs and requested report buttons. The seven matching case studies retain their original content and disclosures. BrowserStack and Allure Report initially had minimal report-only cards. The owner then supplied local PDFs and requested full case studies; both entries now use the same `qaReports` data schema and card as Selenium, under the existing Additional Reports filter. The nine Drive URLs are unchanged. The local PDFs were reviewed; the remote Drive files were not opened or verified, and no tests were independently rerun.

### BrowserStack and Allure source review

- **BrowserStack (21 pages):** tools and scenario are documented on pages 4–6 and 11–15; console/session screenshots and result tables appear on pages 16–19, with the final result on page 21. The report records three Windows 11 web-form executions across Chrome, Edge, and Firefox, all passed, with zero failures, errors, or skips. The summary applies only to the selected form workflow. Screenshots also show other builds and an earlier unmarked Edge session; the portfolio does not claim that every pictured session passed, or that the whole website, mobile devices, or visual regression were tested.
- **Allure (16 pages):** the stack and negative-login scope are documented on pages 4–6, with overview, suite, graph, and diagnostic screenshots on pages 7–15. Three negative-login checks are recorded as passed. The overview includes retry history, so no first-attempt pass rate is asserted. These results demonstrate the reported rejection checks, not successful Facebook authentication, comprehensive cross-browser coverage, a security audit, or a deployed CI gate.
- Only the two new summaries are marked `sourceReviewed: true`. Credentials, configuration values, local paths, private session identifiers, and test inputs are not reproduced on the site. Report source notes distinguish PDF review from independent execution. Rendered pages and extracted text stayed in ignored, dev-server-blocked `tmp/pdfs/` during review; no source PDFs or report screenshots were added to `public/`.

## Record fields and link controls

| Field                         | Meaning                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `id`, `title`                 | Stable identifier and accurate case-study title                                            |
| `category`                    | `automation`, `api`, `performance`, `mobile`, `security`, or `analysis`                    |
| `primaryTool`, `technologies` | Primary tool name and supporting-technology array                                          |
| `context`                     | Confirmed application/environment; do not infer employment attribution                     |
| `summary`, `scope`, `result`  | Concise work, actual scope, and contextual historical result                               |
| `implementation`              | Array of supplied or source-verified activities and investigations                         |
| `limitations`, `sourceNote`   | Evidence limits and explicit provenance                                                    |
| `summaryApproved`             | `true` to publish the owner-approved summary                                               |
| `sourceReviewed`              | `true` for the reviewed BrowserStack and Allure PDFs; `false` for the seven original cards |
| `reportUrl`                   | Exact owner-supplied HTTPS URL, or approved local PDF path                                 |
| `publicReportApproved`        | Owner authorisation to display the report link; does not imply independent review          |

All nine full case-study cards have keyboard-accessible native **View Details** disclosures, scope, recorded results, limitations, and the supplied Google Drive URL. Only BrowserStack and Allure have `sourceReviewed: true`; all nine have `publicReportApproved: true`. Every entry displays **View Report**; the unavailable message remains only as a fallback for future records without approved links.

Owner-authorised HTTPS links open with `target="_blank"` and `rel="noopener noreferrer"`; they do not require or imply independent source review. Local links still require source review, public approval, and an existing PDF with a valid header in `public/documents/qa-reports/`, using a lowercase hyphenated filename. Vite checks local file availability at startup/build. Restart the development server or rebuild after adding/removing an approved local report. Existence and a PDF signature do not establish sanitisation or authorisation.

## Original reports and future public copies

Originals may be stored under `reports-source/`. That folder is ignored by Git, ESLint, and Prettier and denied by the Vite development file server. Local PDF review intermediates belong under `tmp/pdfs/`, also ignored and blocked. Neither is imported into the frontend. Everything placed in `public/` is distributed by the build; an ignore rule alone does not make an asset private.

No specific redaction findings can be asserted without the originals. No PDF redaction or public-copy authoring has been performed. Before publishing a report:

- Inspect relevant pages visually as well as extracting text; include screenshots, tables, examples, annotations, metadata, and embedded files.
- Check for credentials, API keys, session cookies, authentication tokens, personal data, internal URLs, identifiable organisational traffic, and restricted security findings. Produce a sanitised copy and verify its rendered pages and extracted text.
- Obtain explicit public-sharing authorisation for organisational material, particularly the security report. A source-folder link is not approval to publish its contents.
- Verify results and distinguish executed, planned, failed, and unverified checks. Preserve limitations and historical context. Do not silently upgrade these owner-supplied summaries into independently verified PDF findings.
