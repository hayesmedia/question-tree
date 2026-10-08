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

## Free hosting with GitHub Pages
In the GitHub repository, open **Settings → Pages**, and select **GitHub Actions** as the source. The **Publish Question Tree** workflow tests and deploys the static app on every push to `main`. Run it manually under **Actions** if Pages was enabled after the last push. The expected address is `https://hayesmedia.github.io/question-tree/` once GitHub confirms deployment. Only `index.html`, `src` and `flows` are published.

The site and questionnaire data are public. Flow edits are stored locally in your browser; export JSON for backups. Code and supplied-questionnaire updates are published by pushing to `main`. Existing browser data can receive new supplied questions with **Load your questionnaire**. That merge preserves edited data; changed source settings do not automatically override your local edits.
