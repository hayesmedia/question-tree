# Question Tree

Internal questionnaire and diagram editor. Run `npm start` with Node.js 20+; the local server uses port 3000. No dependency installation is required. Run `npm test` for validation, source migration, exports, routing and authentication checks; `npm run build` assembles the deployment assets in `_site`.

## Questionnaire data

`data/questionnaire-v3.json` is the original uploaded package, preserved without changing its question data. It contains **149 questions in 10 stages**, including 107 single-select questions, 42 typed inputs and 39 question visibility rules. Its description says 134 questions, but the actual question array contains 149.

`flows/texas-questionnaire.json` is the editor version. It includes complete prompts, option values/labels/help/unknown flags/order, explanations, beginner help, response types, persona, route codes, URLs, placeholders, units, limits, required/unknown settings, order and parsed visibility branches. Original question records and all stage definitions are retained in the project. Run `node scripts/import-questionnaire.js` to regenerate the editor flow and completeness audit from the package and screenshot baseline.

The package does **not** contain canonical mappings, remember-choice settings, explicit answer destinations or strategy-entry conditions. Existing screenshot mappings and remember-choice settings are retained; missing values are not invented. Visibility dependency connectors associate field conditions with questions by field meaning, separately from canonical mappings. These dependencies are not answer jumps.

**Question data** opens the source review and downloads the original package. Select a card and use **Review uploaded source details** to explicitly replace that card's details if you want to override custom wording. **Import** accepts both editor project JSON and raw questionnaire packages: editor project imports replace the canvas after a backup; questionnaire packages merge source data while preserving custom work. Manually imported packages remain authoritative across reloads; deployments do not replace them automatically.

## Existing work and updates

Deployments upgrade unchanged screenshot fragments automatically using a three-way comparison against `flows/questionnaire-screenshot-baseline.json`. Before an upgrade, the existing browser project is saved as a backup. Custom prompts/settings/answer destinations, removed options, positions, formatting, groups, custom connectors and deleted questions are preserved. Source updates fill missing fields and add missing dependency references. Source connectors intentionally deleted by the user stay deleted. **Question data** lists the fields kept as custom edits.

If a browser cannot save the backup, the upgrade pauses and leaves the existing project intact. **Backup** downloads the saved pre-import/pre-update project. Export **JSON** for an independent backup; browser copies depend on the same origin and profile. Loading an older team project also upgrades its source data, with its original version retained in `question-tree-source-backup` and the current local canvas backed up separately. Team saves remain explicit.

Fresh projects allow space for complete wording and answer options. Source upgrades never reposition an existing saved layout; expanded cards may need rearranging in a previously compact layout.

## Source issues

The source review and `docs/question-data-audit.json` / `.csv` flag five issues:

- Q043 No → Q053 conflicts with Q053 requiring an existing mortgage.
- Q049's earlier Yes/Maybe → Q058 label does not match the exported options; Q058 has a separate OR visibility rule.
- Q099 Yes → Q150 conflicts with Q099 being a currency input.
- Q011 requires property values that are not offered by Q010.
- Q191 still has the source prompt **New question**.

As requested, JSON supplies the question wording/options/visibility; conflicting screenshot connectors remain flagged visual references. Other unconfirmed screenshot connectors are retained. The export does not resolve all strategy-entry or answer-destination paths. Orange dashed connectors mark source conflicts, teal connectors indicate traced references or visibility dependencies, and other dashed connectors remain unconfirmed.

## Editor controls

Hold Space while dragging to pan. Drag empty canvas to box-select fully enclosed cards/groups; Shift adds to the selection. Shift-click group labels or boundaries to select multiple groups, then drag a selected group to move them together. Click empty space to deselect. Sidebar entries include original question IDs, and search accepts IDs or complete prompt text. Group names appear on cards and boundaries. After moving cards or groups, the viewport recenters on their current positions and remembers that focus on reload. **Center diagrams** fits the selection, or all cards when nothing is selected; tall flows can zoom out far enough to fit without the old minimum-zoom clipping. Centering changes the view, not saved diagram coordinates.

The toolbar provides Select/Hand/Connector (V/H/C), undo/redo, duplicate (Ctrl/Cmd+D), delete, group/ungroup, alignment, distribution, fill, connector color, grid and snapping. Shapes include rectangles, diamonds, ellipses and notes. Cards support resize, rotation, font size/style and text/border colors. Select a connector to edit labels, arrows, line style/width, routing or bend points. Automatic routing uses a bounded obstacle search with an exterior-lane fallback; dense layouts may need manual bends.

Screenshot uploads are session-only references, not automatic OCR imports. The dark/light preference persists in browser storage. This editor does not provide full Lucidchart parity or live simultaneous editing.

## Preview and exports

**Test questionnaire** supports select, text, currency, percentage, number, year and date answers. It uses stage/question order when no explicit answer destination exists, and skips questions with false visibility conditions. It shows unresolved conditions for review rather than silently hiding them. Because strategy-entry conditions are not exported, choose a strategy section for the test explicitly. The known Texas stop remains executable. Typed values are temporary preview responses and do not change the editor's source records.

**Project CSV** and **Project PDF** cover the entire project. CSV includes configuration, raw source question records, stage definitions, metadata, groups, source warnings, connectors and formatting. PDF includes tiled diagrams, full prompts and question details, help, options, source issues and stage rules. Choose **Print / Save as PDF** in the report. Project JSON retains the original package. Uploaded screenshot images are not embedded in exports.

## Hosting and shared password

Production: https://question-tree.dry-bonus-373b.workers.dev. Cloudflare's Git integration deploys pushes to `main`; GitHub Actions runs tests/build only. Set the deploy command to `npm run deploy`, which builds before deploying. `wrangler.jsonc` publishes `_site`, never the repository root.

Set **SITE_PASSWORD** as a Cloudflare Worker secret. The Worker protects all static assets and the team API. Sessions last 24 hours with signed Secure/HttpOnly/SameSite=Strict cookies. Changing the password invalidates sessions. Sign out preserves browser work. A missing password fails closed. Never commit the password or send it through chat. Remove separate Worker-specific Cloudflare Access protection if only the shared password is desired, after verifying the password gate works. The local Node server intentionally has no authentication.

**Team project** saves/loads explicitly through a Cloudflare SQLite Durable Object. The included migration creates the binding on deployment. Loading first backs up local work; revision checks reject stale saves. Five previous revisions are retained server-side. No local project is uploaded automatically. Use `wrangler dev` with a test password to test the protected team API locally.
