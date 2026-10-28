# Chithran Jayathunga — Personal Portfolio

A local-first, responsive portfolio for software quality assurance, software development, research, and technical content creation. Built with React, Vite, JavaScript/JSX, plain CSS, and Lucide React. The separate [backend](backend/README.md) now provides the Phase 01–05 Express/MySQL APIs for contact messages, projects, and approved QA evidence. Existing content is preserved through insert-only data migrations; the frontend shows explicit loading, empty, and error states when API data is unavailable. See the backend README for database, SMTP, API URL, and two-terminal local setup. No backend deployment is configured.

See [Phases 03–05 implementation and verification](docs/backend-phases-03-05.md) for the changed files, migration results, tests, and browser checks. Start the backend as well as Vite when reviewing the API-backed sections locally.

## Run locally on Windows

Requires Node.js **20.19+ or 22.12+** (Node 22.15 is available in this workspace). In PowerShell:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**, matching the backend's default `FRONTEND_ORIGIN`. Keep the terminal open; press **Ctrl+C** to stop. The server binds only to your computer. Port 5173 is strict: if it is already in use, stop the other server or use `npm run dev -- --port 5174`, update `FRONTEND_ORIGIN` to the exact new browser origin, and restart the backend.

Start the API separately using [backend/README.md](backend/README.md). Configure the ignored `backend/.env`, initialize MySQL, and run the insert-only project and QA migrations before reviewing API-backed sections. SMTP notifications require the seven documented `SMTP_*` settings; messages are still saved if notification delivery is unavailable. Database and SMTP credentials belong only in backend configuration, never in `VITE_*` values.

### npm launcher workaround on this computer

The default npm launcher was observed pointing to a missing roaming `npm-cli.js`. If you see `Cannot find module ...AppData\Roaming\npm...`, use the installed CLI directly:

```powershell
Set-Location -LiteralPath 'D:\SLT QA\My_Portfolio'
$portfolioNpmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
node $portfolioNpmCli install
node $portfolioNpmCli run dev
```

This avoids changing your global Node/npm installation. The same workaround works for every npm command below.

## Checks and production preview

```powershell
npm run lint
npm run test
npm run format:check
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/** for the built version. To test its API-backed sections against the local backend, build with `VITE_API_BASE_URL=http://127.0.0.1:3001` in the optional root `.env`, set the backend's `FRONTEND_ORIGIN=http://127.0.0.1:4173`, and restart the backend. Without an explicit API base, production builds use same-origin `/api` paths; the Vite preview server does not provide those endpoints. Restore the development origin before returning to port 5173. `npm run format` formats the project. Use `npm ci` instead of `npm install` for a clean installation matching the committed lockfile.

## Your manual assets

### Professional photo

Your supplied photo is **`public/images/profile/Photo.jpg`** and is connected in **`src/data/siteConfig.js`**:

```js
profileImagePath: '/images/profile/Photo.jpg',
profileImageIsPlaceholder: false,
```

Replace that file to update the portrait, or change `profileImagePath` when using a different filename. Use an optimized portrait, ideally 800–1200 pixels wide. The existing responsive frame crops the photo with `object-fit: cover` and `object-position: center 30%`; adjust `.portrait-image` in `src/styles/index.css` if needed.

If the photo fails to load, the original `public/images/profile/profile-placeholder.svg` monogram appears with a placeholder caption and alt text. The loaded photo has the accessible alt text “Chithran Jayathunga”.

### Actual CV PDF

Your supplied PDF is **`public/documents/Chithran-CV.pdf`**. The existing `cvPath` configuration connects the **Download CV** link. Restart `npm run dev` (or rebuild with `npm run build`) after replacing, adding, or removing it.

The default `cvPath` in **`src/data/siteConfig.js`** already points to `/documents/Chithran-CV.pdf`. Vite checks for a real PDF header at startup/build. An absent or invalid file shows the non-interactive text “CV coming soon”; it never generates a broken download button. Restart/rebuild after removing the CV as well. Do not remove a CV from an already built `dist/` without rebuilding. PDFs and everything else inside `public/` are public assets.

### Google Drive video portfolio

Your supplied Google Drive folder URL is stored once in **`googleDrivePortfolioUrl`** in **`src/data/siteConfig.js`**. Every video card and the featured **Watch Videos on Google Drive** action reads this field through **`src/data/videoProjects.js`**. Each opens the same shared collection in a new tab with `rel="noopener noreferrer"`; these links do not play an individual video. Update the config field to change the destination; set it to `null` to show an unavailable-link message.

Configure Drive sharing permissions separately and test the link in a signed-out/private browser window. Adding a URL here does not make private files accessible.

### Video thumbnails and project data

The 12 video projects, four categories, descriptions, thumbnail paths, and featured selection live in **`src/data/videoProjects.js`**. The Content section reuses the existing scroll-reveal hook, external-link safety, and filter styling. Category filters include the featured entry only when it belongs to the selected category.

No video thumbnail folder or images were present at implementation time. **`public/images/videos/`** is now prepared for your actual files. Preserve the original filenames and match each image using its filename and visible content. Set the matching project's **`thumbnailPath`** to **`/images/videos/<exact original filename>`**, including the extension and case. URL-encode reserved characters (for example, `#` becomes `%23`). Leave uncertain matches as **`null`** for review. No filenames or images are invented.

The featured entry is **Digital Platform Division Video**, using its owner-mapped original thumbnail. Set **`featured: true`** on exactly one project to change it. Images use a 16:9 display crop with `object-fit: cover`; source files are never modified. Missing or unreadable thumbnails show a labeled text-only state. Refresh the local browser after editing the data file; rebuild before distributing a production build.

Check all five filters at desktop, tablet, and mobile widths. Expected counts are **12 / 1 / 3 / 3 / 5** in filter order. Each video appears once; **All Videos** restores the featured entry and the full grid. Tab through the filter buttons and Drive actions to check focus visibility. No player or individual-video URL is configured.

### Verify the connected assets locally

1. Open **http://127.0.0.1:5173/** and refresh. Confirm your photo appears in the hero without the “coming soon” caption. Narrow the window to check the crop on mobile.
2. Click **Download CV** beneath the hero buttons. Open the downloaded PDF and confirm it is your CV. You can also open `/documents/Chithran-CV.pdf` directly on the local site.
3. Scroll to **Content** and click **Watch Videos on Google Drive** or a card's **View in Google Drive** action. Confirm a new tab opens the shared Drive folder. Verify access in a private/signed-out window before any eventual public release.

### Certificate images

All nine learning records are in **`src/data/certifications.js`**. The six original certificate images are installed in **`public/images/certifications/`**, using the exact mapping below. The supplied files under their original names were preserved; the clean copies have identical SHA-256 hashes, with no cropping or image modification.

| Original file                                                               | Destination filename                               |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| `Agile_Project_Management_E-Certificate conv 1.png`                         | `agile-project-management.png`                     |
| `Generative AI for Everyone_page-0001.jpg`                                  | `generative-ai-for-everyone.jpg`                   |
| `Introduction_to_Software_Quality_Assurance_E-Certificate conv 1.png`       | `software-quality-assurance.png`                   |
| `Power BI for Beginners_page-0001.jpg`                                      | `power-bi-for-beginners.jpg`                       |
| `Project_Communication_and_Stakeholder_Management_E-Certificate conv 1.png` | `project-communication-stakeholder-management.png` |
| `Prompt Engineering_page-0001.jpg`                                          | `prompt-engineering-github-copilot.jpg`            |

Keep the actual original files; renaming does not crop or modify image contents. Restart `npm run dev` after copying or removing images, or run `npm run build` for production. Vite checks the configured paths at startup/build; missing images show an honest status instead of broken thumbnails. Existing images can be replaced at the same path, then refresh the browser.

The first six cards use a consistent landscape preview with `object-fit: contain`. Clicking an available image or **View certificate** opens the full uncropped image in an accessible native dialog. **Open original image** allows browser zoom in a new tab. If an image fails to load, the card and dialog retain readable title, issuer, and date details. The three LinkedIn Learning entries are intentionally text-based records from the CV.

Exact Simplilearn dates were read from the supplied images: Generative AI for Everyone on 11 December 2025, Power BI on 9 December 2025, and Prompt Engineering on 10 December 2025. The other six entries retain CV-supported month-level dates. No certificate IDs, unsupported dates, or individual verification URLs are invented. University of Moratuwa entries use the **general** portal configured as `certificateVerificationUrl` in `siteConfig.js`. Simplilearn SkillUp records are course-completion acknowledgements and are not represented as official Microsoft certifications.

To verify: open **http://127.0.0.1:5173/#certifications**, inspect all nine cards, and test the dialog using the keyboard, Tab/Shift+Tab, Escape, and the close button. After copying images and restarting, confirm all six thumbnails and full-size images load. Narrow the window to inspect the 1/2/3-column responsive grid.

### Phone visibility

Set **`showPhone: false`** in `src/data/siteConfig.js` to hide the phone from the contact section. To remove it from the public JavaScript bundle entirely, also clear `phone` and `phoneHref` before building. Email, social links, image path, CV path, and the Drive URL all live in this same central file.

## Content and architecture

```text
public/
  favicon.svg
  documents/                 # Add the actual CV here
  images/profile/            # Photo.jpg + original fallback placeholder
  images/projects/           # Original conceptual SVG illustrations
  images/certifications/     # Six original certificate images (see mapping above)
src/
  components/layout/         # Header and footer
  components/sections/       # One component per portfolio section
  components/ui/             # Shared link, social, and section-heading components
  data/siteConfig.js         # Personal information, links, asset paths, visibility
  data/portfolio.js          # Original project migration source, skills, education, TODOs
  data/aiLiteracy.js         # AI competencies, planned mini-projects, future links
  data/certifications.js     # Nine certification records and issuer notes
  styles/index.css           # Tokens, component styles, responsive rules
  App.jsx
  main.jsx
```

- A single page fits recruiter review without a client router. The separate Express backend handles contact submissions and public catalogue reads.
- Dependencies are pinned and a lockfile records transitive versions. React and React DOM match; Vite and its React plugin support the installed Node version. ESLint 9 uses a flat config with React Hooks and refresh rules. Prettier keeps JSX and content modules readable.
- The project grid uses reusable cards and filters. Native modal dialogs support keyboard focus containment, Escape to close, background inertness, scroll locking, and focus restoration.
- Original SVGs represent project concepts, **not screenshots** of completed systems. Labels make that distinction visible. Replace them with approved screenshots later, updating alt text and illustration labels together.
- Contact details retain real `mailto:`, `tel:`, and social links. The separate contact form confirms success only after the API confirms a saved message.
- Fonts have system fallbacks. Motion is subtle and disabled for reduced-motion preferences. The layout includes a skip link, semantic headings, keyboard focus indicators, and responsive navigation.
- Open Graph metadata is included without a fictional production URL. After local approval and a real deployment, add the verified canonical URL, `og:url`, and an absolute approved social image URL to `index.html`.

## Glass surfaces and QA tools marquee

The **QA Tools & Technologies** section is immediately after the Hero and before About, at **`#qa-tools`**. Its 14 labels and local logo paths live in **`src/data/qaTools.js`**; **`QaTools.jsx`** renders two rows in opposite directions using CSS transforms. The second copy of each row is hidden from assistive technology. Fixed tile/image dimensions and equal-width copies keep the loop continuous without image-loading shifts.

Hover over the rows to pause temporarily. The keyboard-accessible **Pause & show all** button stops motion and displays all 14 tools in a static grid; **Resume motion** restores the loop. Reduced-motion preferences automatically select the static layout. One Intersection Observer stops the tracks offscreen, and the existing page-visibility flag pauses them in a background tab. Missing logos show the tool name rather than a broken image or substitute icon.

Original logo files are in **`public/images/tools/`**; the site loads them locally with no runtime logo-CDN requests. See **[`docs/tool-logo-sources.md`](docs/tool-logo-sources.md)** for exact official/Devicon sources and attribution. GitHub Actions is the owner-confirmed provider represented by **CI/CD Pipelines**. Update the corresponding data entry when changing a tool or asset, preserving the source/license notes.

**`src/styles/theme.css`** defines the shared **`--glass-*`** tokens for Light and Dark. **`src/styles/glass.css`** is loaded after existing styles and changes surface treatments, keeping layout and motion rules intact. Glass cards use restrained blur, translucent fills, borders, and shadows; dark internship/contact surfaces retain their readable text. Mobile removes card blur in favor of denser fills, with limited blur on navigation/dialogs. Unsupported backdrop filters, reduced transparency, and forced colors have solid fallbacks. Moving logo tiles use translucent fills without expensive moving backdrop blur.

Review both themes at narrow and wide widths, pause/resume the marquee, emulate reduced motion and reduced transparency, and open the existing project/certificate dialogs. Keep logo artwork unchanged; new brand assets belong in the same folder with provenance recorded.

## Light and Dark themes

Use the moon/sun button in the header to switch themes. It stays available beside the mobile menu, supports keyboard activation, and announces the action through its accessible name. **Dark is the default for first-time visitors**, regardless of the operating system's color preference. A saved Light or Dark choice takes priority; the original white-and-blue Light palette remains available.

The selected value is saved under **`portfolio-theme`** in localStorage and restored by the small synchronous **`theme-init`** script in **`index.html`** before styles and React load. The initial HTML theme and browser-chrome color are Dark as well, preventing a Light flash. Missing, invalid, or unavailable storage falls back to Dark; switching still works for the current visit if saving is blocked. Changes are synchronized across tabs on the same origin. Removing the saved key resets the site to Dark. Theme preferences are separate for development and production origins.

Maintain both palettes in **`src/styles/theme.css`**. Shared styles consume semantic tokens for surfaces, text, borders, actions, gradients, dialogs, and native form controls. Photos, thumbnails, and certificate artwork retain their original colors. **`src/utils/theme.js`**, **`src/hooks/useTheme.js`**, and **`ThemeToggle.jsx`** manage application and persistence. Keep the bootstrap storage key and browser theme colors in sync with the utility; automated tests cover this contract.

Theme changes use a short native View Transition crossfade where supported, without replacing existing motion. Other browsers use the CSS color transitions and normal palette switch. Reduced-motion preferences bypass the crossfade. Test both themes, reload after choosing Dark, open project/certificate dialogs, and check the toggle with Tab and Enter on desktop and mobile. **`npm run test`** runs the existing motion tests and the theme/bootstrap tests.

## AI Literacy and planned mini-projects

The **AI Literacy** navigation link opens **`#ai-literacy`**, after Skills. Content, the seven competencies, and all five mini-project plans live in **`src/data/aiLiteracy.js`**. The section reuses the existing section heading, skill tags, icons, native scroll reveals, and safe external-link component. Every project is explicitly **Planned**; no completed work, results, evidence, or proficiency scores are implied. Planned entries are excluded from the existing portfolio collection counts.

To add a real GitHub or documentation link, find the matching project by **`id`** in **`aiMiniProjects`**, set **`linkUrl`** to the full public **`https://`** URL, and set **`linkLabel`** to **`View on GitHub`** or **`View documentation`**. Leave **`linkUrl: null`** until a real destination exists. Missing or invalid links display non-interactive **Documentation link pending** text; valid links open safely in a new tab. Adding a URL does not automatically change the project's status.

When actual work supports an update, edit that project's **`status`**, **`description`**, and **`skills`**, and update **`aiLiteracy.projectsNote`** to reflect the collection accurately. Never add unverified results or private credentials. Test both the header/mobile-menu and footer links, narrow the window, and emulate reduced motion when reviewing changes.

## Motion and interactions

Motion uses native browser APIs and CSS; no animation dependency was installed. **`src/hooks/usePortfolioMotion.js`** coordinates the whole portfolio, **`src/styles/motion.css`** defines the visual effects, and **`src/utils/motion.js`** holds the tested calculations. See **`docs/motion-upgrade.md`** for the full change list and verification record.

- The hero has three soft gradient orbs, six ambient light points, a fine grid, and restrained desktop pointer lighting. Ambient animation pauses offscreen and when the document is hidden. Mobile/coarse-pointer layouts use a static background.
- `data-hero-step` controls line/role entrances over 680 ms, with 65 ms between steps. The original name, roles, description, actions, and portrait remain intact. The accent underline has a single entrance; there is no rotating or typing text.
- `data-reveal` opts into a one-time 520 ms reveal; section headings use 650 ms. `data-stagger` groups children with bounded 55 ms offsets. Rendered content is visible by default. Native entrance **translate** composes with CSS hover **transform** so the two effects do not override one another.
- `data-tilt` enables delegated desktop pointer tilt (up to 5 degrees per axis); `data-tilt="quiet"` caps QA/video cards at 3 degrees. It uses one delegated handler and scheduled frame, preserves image zoom, and returns to neutral on exit/focus/resize. Tilt is disabled at widths of 768px and below, on unsuitable pointers, and for reduced motion.
- Decorative timeline rails track viewport progress through the existing internship, project, education, and certification layouts. They preserve all original entries, ordering, and dates. Their highlighted entry indicates viewport position, not employment status or a new chronological claim.
- The **In this portfolio** count-ups derive from the existing project, approved QA-summary, certification, and video data arrays. They count once, reserve number space, and expose stable final values to screen readers. They are collection sizes, not success rates or skill levels. Historical report findings are never animated.
- A thin header reading-progress line uses the same scheduled frame as pointer/counter updates. There is one passive window scroll listener, no per-card scroll listeners, and no idle requestAnimationFrame loop. Active navigation, native hash/history behaviour, offsets, and menu controls remain intact.
- Reduced motion skips/cancels entrances and count-ups, stops ambient motion, disables tilt, and shows complete static timeline rails. Focus cancels an entrance on the focused content. Closed mobile navigation remains `inert`; Escape, outside clicks, and link selection close it.

To inspect locally, run **`npm run dev`**, open **http://127.0.0.1:5173/**, and refresh to watch the hero. Move a mouse across project card bodies, scroll through the rails and collection counts, try filters and dialogs, and follow the page to the footer. Narrow the window to test navigation. In Chromium DevTools → Rendering, emulate **prefers-reduced-motion: reduce** and repeat with the keyboard. Project/certificate dialogs retain the shared focus/Escape handling in **`src/hooks/useDialog.js`**.

Run **`npm run test`** for the five dependency-free Node tests covering bounds, tilt, page/timeline progress, and integer counters. The standard production command remains **`npm run build`** with output in **`dist/`**; deployment configuration is unchanged. This upgrade has not been committed, pushed, or deployed.

## Accuracy and editorial backlog

### QA Reports & Testing Evidence

The **QA Evidence** navigation item opens the section between Projects and Skills. It contains a QA-focused introduction, six focus areas, a personal testing-approach workflow, and nine filterable case studies. BrowserStack and Allure Report appear under **Additional Reports** and use the same full card structure as Selenium: description, technology tags, scope, recorded result, limitations, expandable details, and report link. It reuses the existing reveal hook, design tokens, filter buttons, and safe external-link component. The workflow is personal and does not represent an official SLT process.

**Provenance:** the seven original cards still use owner-supplied work summaries, with their original results and limitations unchanged. The owner subsequently supplied local BrowserStack and Allure PDFs; their text and relevant result screenshots were reviewed to populate those two cards. BrowserStack records three passing desktop web-form executions; Allure records three passing negative-login checks and includes retry history. These are documented results, not independently rerun tests or proof of whole-site compatibility or security. The nine Google Drive URLs remain exactly as supplied; the linked Drive files were not opened or verified.

See **`docs/qa-evidence-review.md`** for the source/provenance record and data schema. **`src/data/qaReports.js`** retains all nine original records as migration input; the section now retrieves approved records from MySQL through the API. Only BrowserStack and Allure have **`sourceReviewed: true`**; the other seven remain **`false`**. All nine retain their exact owner-supplied **`reportUrl`** and **`publicReportApproved: true`**. Native **View Details** disclosures and safe new-tab **View Report** links use the existing reusable card. Authorised external links do not imply source review. The current API exposes approved public HTTPS report URLs and withholds local/private paths. No source PDF has been copied into the public assets, authored, or redacted.

Keep original reports in **`reports-source/`**, which is ignored by Git and formatting/linting and blocked by the Vite development file server. PDF review intermediates belong under **`tmp/pdfs/`**, also ignored and blocked. Neither folder is imported into the frontend. Restart the dev server or rebuild after adding/removing an approved public PDF; do not remove one from an already built `dist/` without rebuilding.

The broader skills list remains intact and does not imply a completed evidence case study for every tool. Expected QA filter counts are **9 total entries**, **2 Test Automation**, **1** in each of the other five original categories, and **2 Additional Reports**. The existing Skills collection count derives from this data and now counts nine full QA case studies.

The SLT internship runs **9 June–9 December 2026**. The status uses the date in Asia/Colombo and is in progress in October 2026. Responsibilities are limited to API testing, test case design, bug reporting, and validation. Do not add confidential internal details, credentials, restricted screenshots, or unapproved workplace artifacts.

Research retains the supplied LoRaWAN project title but explicitly distinguishes implemented point-to-point LoRa from an unverified full LoRaWAN/TTN deployment. Project dates and supplied stacks are in `src/data/portfolio.js`. No fabricated metrics, repository links, demo links, or graduation dates are used.

The `contentTodos` export in **`src/data/portfolio.js`** records unpublished items:

- **Certifications:** all nine records are published, six with their actual image files. Exact dates are used where printed on the images; other completion months are supported by the CV. Only the general university verification portal is linked; individual verification links remain absent.
- **Additional QA case studies:** SDesk incident-transfer testing still needs supporting scope/evidence before a card can be added. The MySLT Playwright workflow is now included as an owner-approved summary; original-source review and permission to publish any report remain separate requirements. Do not infer employment attribution for individual exercises.
- **Tools:** the complete supplied toolkit has been confirmed as hands-on experience and is grouped in `skillGroups`. No proficiency levels, test counts, or outcomes are claimed. Postman and REST Assured each appear once to avoid duplication.
- **Repository/demo links:** replace project `repositoryUrl` or `demoUrl` values of `null` only with verified public links. Actions render automatically when provided. Never use dummy URLs.

## QA Evidence carousel and navigation audit

The QA Evidence section uses **`src/components/ui/QaEvidenceCarousel.jsx`** and **`src/hooks/useEvidenceCarousel.js`** with API-loaded records. The nine original records remain in **`src/data/qaReports.js`** as migration provenance. Filters, disclosures, and report URLs are preserved. The separate QA Tools logo marquee is unchanged.

- The row moves at **24px/second** while visible. One keyed card per report is recycled only after it leaves view; there are no duplicate interactive cards. Short filtered selections use ordinary horizontal browsing when there is insufficient overflow for a seamless loop.
- Hover pauses temporarily. Focusing, dragging, using arrows, or opening details pauses for reading; choose **Resume scrolling** when ready. Close expanded details before resuming. Reduced motion disables automatic movement while retaining native scrolling and arrows.
- Drag horizontally with a mouse, use the scrollbar or arrows, or swipe on a touch device. Tab reaches every disclosure and report link, including offscreen cards. A drag suppresses the resulting click so it does not accidentally open a report.
- Cards use compact spacing and two-line description, scope, and recorded-result previews. **View Details** contains the complete original text and implementation notes; limitations remain fully visible outside the disclosure. Heights grow naturally when details open, and report links retain a 44px minimum touch target at the bottom.
- **`src/hooks/useAnchorNavigation.js`** measures the header for responsive anchor offsets and repairs initial fragment alignment without intercepting native links or browser history.

See **[`docs/portfolio-interaction-audit.md`](docs/portfolio-interaction-audit.md)** for before/after statuses and actual verification. Native touch swiping still needs a physical-device check because the current browser-testing interface cannot dispatch touch gestures. No dependencies were added.

## Review locally

1. Inspect at desktop, tablet, and narrow mobile widths. Check the menu and section anchors.
2. Use only the keyboard: Tab from the skip link; open a case study; check focus stays inside; press Escape and confirm focus returns to its trigger.
3. Try each project filter. Check illustrations, the profile fallback, and the absent-CV state.
4. Verify email/telephone destinations and social URLs. Review phone visibility before eventual publication.
5. Test the CV and Google Drive actions after you supply real assets, and confirm Drive access while signed out.
6. Re-run lint and build after edits. See **`QA.md`** for checks actually performed in this workspace.

## Publishing status

The existing frontend repository and deployment are unchanged by this backend work. Phases 03–05 were implemented and tested locally; no commit, push, backend deployment, hosting connection, or domain purchase was performed. Publishing these changes requires a later approved phase.
