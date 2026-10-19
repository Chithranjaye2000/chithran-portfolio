# Local verification — 18 October 2026

The original implementation checks below are a historical snapshot. See the asset, motion, and certification updates at the end for the latest verification.

## Environment and checks

- Windows PowerShell, Node.js 22.15.0, npm CLI 10.9.2.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed with Vite 8.3.4. Output is in `dist/`.
- Final production assets: JavaScript 262.54 kB (81.66 kB gzip); CSS 27.37 kB (6.72 kB gzip).
- `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund`: passed against the fresh lockfile. This validates lockfile consistency; it is not a second clean installation.
- Successful dependency installation reported zero npm audit vulnerabilities.
- `npm run dev`: started successfully at `http://127.0.0.1:5173/`; HTTP 200 confirmed.
- `npm run preview`: started successfully at `http://127.0.0.1:4173/`; compiled application inspected in the browser.

The commands used the directly installed CLI because the default npm launcher points to a missing roaming npm installation. Exact PowerShell commands and the workaround are in `README.md`.

## Browser checks actually performed

Used the Codex in-app Chromium browser, including viewport emulation and screenshots.

- Inspected the full desktop composition and representative mobile project and tablet skills layouts.
- Checked document widths at 320, 390, 768, 1024, and 1440 pixels: no horizontal content overflow after the narrow-width fix.
- Confirmed project cards switch between one and two columns; skills adapt between one, two, and four columns.
- Tested the mobile menu with pointer and keyboard input, Escape focus restoration, and closing after a navigation link is selected.
- Project filters show **4** total projects, **1** research project, and **3** web/mobile projects. These are content counts, not claimed testing outcomes.
- Opened all four case studies and verified their distinct titles and content.
- Checked dialog opening focus, forward/reverse Tab containment, Escape dismissal, focus restoration, and body scroll unlocking.
- Confirmed all four original project illustrations load when brought into view. Off-screen project images use native lazy loading.
- Confirmed the profile placeholder loads with an explicit placeholder caption and alt text.
- Confirmed there is **no download anchor** while the CV file is absent.
- Confirmed the video portfolio button is disabled while the Drive URL is `null`.
- Confirmed the internship displays **Internship in progress** for the October 2026 date.
- Verified every internal fragment link resolves to an element. Inspected mailto, tel, LinkedIn, and GitHub destinations against the supplied values.
- Verified external links include `noopener noreferrer`.
- Confirmed one page-level h1, image alt attributes, and named buttons.
- Reviewed computed text contrast against inherited solid backgrounds. No failures were found in normal readable page text; two decorative `aria-hidden` plus marks have 3.34:1 contrast. This targeted check does not replace a comprehensive accessibility audit.
- Emulated reduced motion and confirmed the document uses automatic rather than smooth scrolling.
- Production smoke test confirmed page rendering, the absent-CV state, disabled Drive state, and a working QuickJob dialog.
- No warnings or errors were present in the inspected browser console.

## Issues found and fixed

- Interrupted package downloads left incomplete native and JavaScript dependencies. A fresh installation with a workspace cache and lower network concurrency resolved them; the fresh lockfile passed consistency validation.
- Current Lucide no longer exports the requested social brand symbols. Small local SVG components provide those symbols while Lucide supplies interface icons.
- A decorative hero badge overlapped the portrait's location caption. It now sits below the frame.
- Native dialog behavior allowed Tab to leave the single-control dialog. Explicit focus wrapping now handles both directions.
- The mobile outside-click handler could see a detached SVG target after React swapped the menu icon and immediately close the menu. Handling outside pointer-down events resolves this ordering issue.
- Removed a minimum body width that caused horizontal scrolling in narrow Windows viewports.
- Darkened secondary text colors for sufficient contrast.

## Manual inputs and remaining verification

- Add the actual professional photo, CV PDF, and Google Drive link using `README.md`.
- The actual CV download and real Drive access cannot be tested until supplied. Test Drive in a signed-out browser and restart/rebuild after adding or removing the PDF.
- The initial placeholder image was tested; an intentionally missing custom photo was not injected. An `onError` fallback is implemented for that future state.
- Confirm public project repository/demo URLs, certification details, and the permitted scope of any additional workplace case studies before adding them.
- External social destinations were inspected as hrefs; account availability, mail clients, phone handlers, and external service access were not end-to-end tested.
- No physical mobile device, Safari, Firefox, screen reader, automated axe audit, or formal WCAG conformance assessment was run. Future public-release QA should include those as appropriate.
- Google Fonts are requested for typography; local system fonts are configured as fallbacks. Offline font fallback was not separately emulated.

No GitHub repository creation, Git push, Vercel connection, publication, or domain purchase was performed. The development server is available for the requested local review.

## Asset connection update

The manually supplied assets are now connected through `src/data/siteConfig.js`:

- The hero uses `public/images/profile/Photo.jpg`, with `profileImageIsPlaceholder: false`, alt text “Chithran Jayathunga”, and the existing responsive `object-fit: cover` / `object-position: center 30%` styling. The image loaded in the browser and its placeholder caption was absent.
- The existing CV path points to `public/documents/Chithran-CV.pdf`. Its `%PDF-` header was confirmed. The local endpoint returned HTTP 200, `application/pdf`, and 137,867 bytes. Clicking the hero's **Download CV** link completed a browser download.
- The provided Drive folder URL is stored only in the central configuration. **View video portfolio** renders as an enabled link with the exact supplied URL, `target="_blank"`, and `rel="noopener noreferrer"`. Its destination attributes were verified; Drive permissions and signed-out access were not independently tested or changed.
- The production copies of both the photo and CV match the source files by SHA-256.
- The desktop hero was visually reviewed. At a 390 px viewport, the image measured 317 × 290 px with cover cropping; the page had no horizontal overflow.
- `npm run lint`: passed, exit code 0, with zero warnings.
- `npm run build`: passed, exit code 0. JavaScript 262.63 kB (81.74 kB gzip); CSS 27.37 kB (6.72 kB gzip).
- The inspected browser console had no warnings or errors.

The commands used the documented direct npm CLI workaround. No dependency changes, project recreation, GitHub repository creation, or deployment occurred. Local browser verification steps are in `README.md`.

## Motion update

Added native Web Animations API entrances and Intersection Observer reveals through `src/hooks/usePortfolioMotion.js`, with interaction transitions in `src/styles/motion.css`. No dependencies were added or changed. The Education area is included; certifications remain an unpublished content TODO.

Browser checks actually performed in Chromium:

- Observed the hero's seven marked content groups start at opacity 0 with a 22 px translation, then settle at opacity 1 with no transform. The stagger covers name, headline, introduction, buttons, social/CV actions, and portrait.
- Observed a running 520 ms section-heading reveal during project navigation.
- Changed project filters and observed new project cards receive running 520 ms native animations. Research and web/mobile filters retained the expected 1 and 3 cards.
- Enabled reduced motion during active card reveals: running entrances dropped to zero and every marked content block was fully visible.
- Reloaded with reduced motion enabled: hero content was fully visible with zero entrance animations.
- Verified mobile navigation opens with pointer input and runs a CSS transition when motion is enabled.
- Verified closed mobile links are inert, and pressing Tab after the menu toggle moves to the hero's View projects link instead of hidden navigation.
- Verified Escape closing behavior and desktop resizing: the menu closes, desktop links remain visible, and desktop navigation is not inert.
- Focused a hero control during the entrance: its actions container immediately became fully visible with no remaining entrance animation; the next focused social group was also fully visible.
- Inspected the browser console: no warnings or errors.
- Rechecked widths at 320, 390, 768, and 1440 px: no horizontal document overflow. Mobile navigation was inert while closed, and desktop navigation remained interactive.
- Rechecked the QuickJob dialog after adding motion: correct case study, contained Tab focus, Escape dismissal, and focus returned to the trigger.
- Final `npm run lint`, `npm run format:check`, and `npm run build` passed with exit code 0. The production build contains JavaScript 264.99 kB (82.42 kB gzip) and CSS 29.38 kB (7.19 kB gzip). Commands used the documented direct npm CLI workaround.

Entrance and reveal effects use transforms and opacity; the menu remains absolutely positioned. This avoids layout-changing animation properties. This was a targeted interaction review, not a formal performance benchmark or physical-device test. The development server remains available for local review; nothing was pushed or deployed.

## Certifications update

Added all nine user-specified certification records in `src/data/certifications.js`, a responsive section, reusable cards, and a native image/detail dialog. Navigation now includes Certifications. The new cards use the existing one-time reveal hook and reduced-motion behavior. Shared native-dialog focus handling was extracted into `src/hooks/useDialog.js` and reused by the project case studies.

### Source accuracy and actual assets

- Completion months were checked against the certificate list in the local CV: Agile Project Management and Software Quality Assurance in November 2025; Project Communication in December 2025; Responsive Web Design in July 2025; Python Collections and Generative AI Negotiation in June 2025. The actual Simplilearn images support exact dates: Generative AI on 11 December 2025, Power BI on 9 December 2025, and Prompt Engineering on 10 December 2025.
- Issuer names follow the user's supplied titles. Simplilearn entries explicitly describe course completion, not official Microsoft certification.
- Only the supplied general university verification portal is linked. No individual verification links, credential numbers, or precise completion days were invented.
- The originals became available in `public/images/certifications/` during the task. All six were copied to the requested clean filenames; their original-name files were preserved. SHA-256 comparisons confirmed identical bytes for every copy. No images were generated, cropped, or modified.
- Availability is now **6 of 6 expected files**. Each image endpoint returned HTTP 200, the correct image MIME type, and bytes identical to the clean local copy.
- The missing-image fallback was tested before the originals arrived. With the originals installed, six actual image previews and three intentionally text-based LinkedIn Learning cards are shown, with zero pending-image states.
- Inspected all six original images and opened all six actual full-image lightboxes. Every image loaded, used contain sizing, and exposed the correct original-image link.
- Real-image testing exposed intrinsic image sizes stretching the preview areas. Positioning each image button inside a reserved landscape frame fixed this. All six media frames now have equal heights at each tested width: 186 px at 320, 229 px at 390, 227 px at 768, and 253 px at desktop width. The originals remain byte-identical and fully contained.

### Browser checks actually performed

- Confirmed nine cards, six actual image previews, and three text cards.
- Opened all nine detail dialogs and checked the correct title for each.
- Verified initial close-button focus, forward and reverse Tab containment, Escape dismissal, restoration of focus to the selected card, and body scroll unlocking.
- Tested the visible close button on mobile and inspected the long Prompt Engineering title and course-completion note without horizontal dialog overflow.
- Checked 320, 390, 768, 1024, and 1440 px widths: no document overflow; the grid adapts to one, two, and three columns.
- Confirmed the general verification destination, existing section navigation, and correct dates at their supported precision.
- Observed running 520 ms certificate-card reveal animations. Enabling reduced motion cancelled them and left all cards fully visible.
- Rechecked the existing QuickJob dialog after extracting the shared hook: correct content and contained keyboard focus.
- No browser warnings or errors were present in the inspected console.

The new mobile Certifications navigation link was visible and closed the menu after selection. A screenshot of the completed nine-record section is saved under `artifacts/certifications-preview.jpg`. The main README documents exact image filenames, replacement instructions, and restart/build behavior.

Final checks after installing the actual images and fixing the frame sizing: `npm run lint`, `npm run format:check`, and `npm run build` passed with exit code 0 using the documented direct npm CLI workaround. Final JavaScript is 275.04 kB (84.81 kB gzip); CSS is 34.60 kB (7.99 kB gzip).

No dependency changes, repository creation, Git push, or deployment were performed. The local development server remains available for review.

# QA evidence section verification — 18 October 2026

- Seven case studies use the owner's explicitly authorised summaries. No original report PDFs were reviewed; all original-review/public-report flags are false and report URLs are null.
- The QA section sits between Projects and Skills, with a new navigation item, six focus areas, category filters, and a personal testing-approach workflow.
- Browser filter counts: All evidence 7; Test Automation 2; API, Performance, Mobile, Security, and Static Code Analysis 1 each. Each filtered set contains only its category.
- Native View Details disclosures open with Enter and close with Space; visible keyboard focus was checked. No active View Report link appears for the unavailable source PDFs.
- Responsive layouts were checked at 1440, 1024, 961, 820, 390, and 320 pixels: no QA-section overflow or desktop navigation overlap. Mobile QA navigation opens, navigates, and closes; closed navigation remains inert.
- Reduced-motion emulation disables meaningful card transitions and the reveal hook respects the preference. Temporary emulation/viewport overrides are reset after review.
- Existing content remains present: 4 projects, 9 certifications, and 12 video cards. No original images or reports were moved or modified.
- A request to an existing file under reports-source returns HTTP 403. Original source files are absent from dist, and the source Drive identifier/private source paths do not appear in the frontend bundle.
- npm lint, production build, and repository formatting checks pass using the installed npm CLI path documented in README. No additional package was installed.
- Public report access and PDF redactions cannot be verified without original/sanitised files; no active report buttons are published. See docs/qa-evidence-review.md for the publication checklist.

# Creative motion upgrade verification — 19 October 2026

- Extended the existing native motion hook/CSS without adding a dependency. Added ambient hero layers, line/role entrances, delegated desktop tilt, timeline rails, data-derived count-ups, and a reading-progress/header treatment.
- Native browser inspection captured staggered 680ms hero animations and nine ambient animations. Hero text retains the complete accessible name and approved roles. Ambient animation pauses when the hero is offscreen; at <=768px it becomes static.
- Verified actual 3D matrices and reset behaviour on all four main project cards; also checked the quieter Bell Pepper Monitor QA card and featured video. All 23 eligible cards use the shared delegated system.
- Counter observation recorded values progressing from 0 to the actual 4/7/9/12 totals. A second visit produced no new counter text writes. Accessible final values stay stable; report metrics are not animated.
- Responsive checks at 320, 375, 768, 1024, and 1440px found no horizontal overflow, clipped hero name, or desktop navigation overlap. Mobile Tab/Enter/Escape and link selection preserved the closed menu's inert state.
- Reduced-motion emulation showed zero hero animations, no tilt, visible name lines, static complete rails, and final collection values. Dynamic project/QA/video filters still worked.
- All four project dialogs and six image-certificate dialogs opened, closed on Escape, and restored focus. Certificate Shift+Tab stayed contained. All 23 displayed images decoded; internal anchors resolve and all new-tab links retain noopener/noreferrer.
- Download CV triggered a real download; its SHA-256 matches public/documents/Chithran-CV.pdf. Email and telephone hrefs were checked without sending email or placing a call. Reading progress reaches scaleX(1) at the footer; Contact now exposes its active location.
- Five Node tests cover bounds, tilt, reading/timeline progress, and integral bounded counters. Lint, tests, formatting, and the Vite production build are run against the final code. See docs/motion-upgrade.md for the full file inventory and verification limits.
- The five portfolio data modules are byte-for-byte unchanged from the start of this task. Pre-existing image replacements/data edits remain intact. No commit, push, dependency install, or deployment was performed.
