# Question Tree
Internal questionnaire flow editor. Run `npm start` with Node.js 20+ and open port 3000. No dependency installation or API credentials are required.

Features: draggable questions and deal outcomes, editable answers and destinations, start node selection, multi-selection (Shift-click), grouping and ungrouping, group movement, pan/zoom/fit, search, undo/redo, local browser saving, validated JSON import/export, screenshot reference uploads, and a questionnaire preview with cycle detection.

Screenshots are manual recreation references, not automatic OCR imports. They remain in the current browser session. Flows save only in the current browser; export JSON for backups or sharing. This prototype has no authentication, shared storage, or real-time collaboration. Add those before hosting confidential questionnaires on a shared network.

Run `npm test` for flow validation and routing tests. Sample deal classifications are illustrative; replace them with your questionnaire.

## Supplied questionnaire
`flows/texas-questionnaire.json` contains the first two screenshot sections: 32 questions and the Texas-only stop. New browser sessions load this flow; existing sessions can use **Load your questionnaire** (export any current work first). Original question IDs are retained. Clipped text is marked in Properties. Dashed screenshot connectors are visual references, not executable answer routes. Only the readable Texas split has answer routing; the remaining answers and cropped bypass destinations require more source information.

Section 2, **2. SELLER, TITLE AND DEBT**, adds 27 unique questions (59 total). Earlier section labels are **0. SETUP - shows when property.address.state = TX** and **1. PROPERTY AND CONTRACT**. Every supplied card shows its section title and source ID. **Load your questionnaire** now merges by ID, preserving edited questions and avoiding duplicates across overlapping screenshots. Missing answer routes remain unconfigured; dashed connector ordering is provisional.

Section 3, **3. DEAL ECONOMICS**, adds Q070–Q099 plus G003 and G004: 32 new questions, bringing the total to 91 across four groups. Overlapping Q191 and Q095–Q099 are retained only once, including the duplicated final screenshot. Merge the supplied flow to add this section without replacing existing question edits.

The next screenshot batch adds **4. DUE DILIGENCE** (15), **5A. WHOLESALE** (7), **5B. FIX AND FLIP** (7), **5C. HOLD / BRRRR** (8), and the visible beginning of **5D. CREATIVE FINANCE** (2). Total: 130 unique questions across nine groups, plus the Texas stop. Strategy tags are shown alongside question IDs. Creative Finance remains partial pending further screenshots.

Creative Finance now includes Q160–Q169, and **6. CONTRACT AND CLOSING** includes Q180–Q190. This batch adds 19 unique questions; the total is 149 questions in ten groups plus the Texas stop. Overlapping Q166, Q180, Q183, Q184 and Q188 are deduplicated. Wording and answer routes still need completion from full source material.

Question-detail screenshots for Q001, Q002, Q004 and Q007 populate explanation, settings, option values and labels, and any visible canonical mappings. Missing visibility/mappings/routes remain unconfirmed. Project CSV exports all cards and nested data as JSON columns. Project PDF opens the full project report with tiled group diagrams and question details; choose **Print / Save as PDF** in that report. These are project-wide exports, not per-card downloads.

## Upload stopping point
Question-detail uploads are complete through **Q012**. Resume at **Q013**. All overview flow screenshots have already been captured. Q012 includes Seller/owner, Tenant, Vacant and Other occupant, with its confirmed `property.occupied` mapping.

## Hosting and automatic updates
The project is hosted on Cloudflare Workers at https://question-tree.dry-bonus-373b.workers.dev, protected by Cloudflare Access. Cloudflare's Git integration deploys pushes to `main`. GitHub Actions runs tests and builds only; the unused GitHub Pages deployment has been removed.

Flow edits save locally in your browser. Export JSON for backups, and use **Load your questionnaire** to merge supplied-questionnaire updates after a deployment.

## Cloudflare Workers static hosting
Use **Build command:** `npm run build` and **Deploy command:** `npx --yes wrangler@4.149.0 deploy` in Cloudflare's Git-connected Worker settings. Alternatively use `npm run deploy` as the deploy command, which builds first. `wrangler.jsonc` publishes only `_site`, assembled from `index.html`, `src` and `flows`; never set the assets directory to the repository root. This excludes dependencies, development tools and Git metadata from deployment. Cloudflare supplies authentication in its build environment. No API keys belong in repository files.

## Theme and connection review
The toolbar includes a dark/light toggle; the preference persists in browser storage and defaults to the system theme. Individual canvas cards show their source ID/strategy label and question, while group titles remain on group boundaries and in Properties.

The latest screenshot review adds local bypass references. Teal connectors indicate endpoints traced within screenshots, not executable answer routing. Dashed lines remain unconfirmed. Candidate bypass origins hidden by overlapping lines are explicitly marked as requiring confirmation. `connectionReview` in the supplied JSON tracks outstanding long cross-section routes and strategy entry conditions. All-connectors completeness is not yet established; see the pending routing question in chat. CSV and PDF reports preserve outgoing screenshot connector references.

Group names are again included on canvas cards, following the latest user clarification, as well as on group boundaries. The Due Diligence exit **Q119 → Q130 (Wholesale)** is confirmed as a visible sequence; conditional entry/bypass rules remain separate.

## Preserve browser edits
Normal deployments do not replace the `question-tree` browser record. Source merges now preserve existing nodes and groups exactly, including wording, settings, destinations, removed answers, grouping and positions. Only missing nodes and connector references are added; questions deleted after this safeguard are not reintroduced. Source updates to existing questions therefore require an explicit manual edit, rather than automatic replacement. Imports intentionally replace the active flow, but imports and source merges first store `question-tree-backup`; download it using **Backup** and restore via Import. Backup failure blocks the operation. These browser copies are local to the same origin and browser profile; export JSON for an independent copy.

## Shared-password login on Cloudflare
The Worker protects every static asset with a server-side shared password. In **Workers & Pages → question-tree → Settings → Variables and Secrets**, add **SITE_PASSWORD** with type **Secret** and your chosen password, then deploy. Never commit it or send it through chat. A missing secret fails closed with a setup message. Sessions last 24 hours; cookies are Secure, HttpOnly and SameSite=Strict. Changing the password invalidates existing sessions. Sign out does not delete browser-saved flows.

To use only this shared password, remove the separate Worker-specific Cloudflare Access protection after verifying the password secret is configured and the Worker is deployed. Otherwise users will see both the Cloudflare email gate and the password gate. The local Node development server remains for local testing without authentication; only the Cloudflare Worker enforces production login. Shared passwords do not provide individual accounts or audit history.

## Canvas controls
Hold Space while dragging to pan (including over cards/groups). Drag empty space to box-select fully enclosed cards/groups; Shift adds to the selection. Shift-click group labels or boundaries to select multiple groups, then drag a selected group to move them together. Click empty space to deselect. Sidebar entries include question IDs and search accepts IDs.

**Connect cards** lets you pick a source and destination for a visual connector. Click a connector to edit its label, arrowheads and solid/dashed style or delete it. Answer-destination connectors remain executable; newly created visual connectors are references until assigned as answers in Properties. UI-only deployment updates leave saved flows unchanged. The additional pointer controls do not require merging the supplied questionnaire.
