# Multiple canvases and October 19 question copy

The original recovery export contains 150 active questions, 10 groups, 180 reference links and 14 cards with custom fill colors. The question-only copy contains the same 150 active questions and all card formatting/color fields, with zero groups or reference links. Question and option wording, question numbers and internal IDs are preserved; the copy is arranged as five columns with row spacing based on card height.

Removed routing state includes answer targets/fallbacks, continuations, sequence targets, saved response-type navigation backups, question visibility rules and branch conditions. The new project's navigation is explicit-only, so array order does not secretly navigate between questions. Its imported source package and archived questions are not duplicated. The original file is preserved separately without rewriting it.

The original canvas retains the legacy browser storage keys and server object name. Other canvases use scoped keys and separate server objects, including independent revision checks and backups. Switching saves locally and attempts to flush shared edits before navigating; offline/conflicting drafts remain scoped to their own canvas. Group-edit state, selection and undo history reset on load and cannot affect another canvas. The theme remains shared.

Every canvas exports its complete current project JSON. Collection backups use `format: question-tree-canvases` with named canvas entries containing full project flows. Import validates all entries before creating new canvas IDs; no existing canvas is replaced. A dirty local draft is preferred over an older server copy when exporting another canvas's data.

The prepared question-only template is a virtual revision-zero project until the first editor saves it. Reading it with a read token does not write storage. The first browser publishes it using the same compare-and-swap save protocol, after which server storage is authoritative. Catalog defaults expose both original and questions-only canvases; additional named canvases are registered in a separate catalog object.

Verified using the actual uploaded export: switching, original-canvas equality, all card color fields, separate saving, reload without resurrected groups/routes, individual JSON export, and collection export/import. A separate two-browser integration verifies independent-edit merging on a non-main canvas, alongside the original main-canvas collaboration test. Worker/storage tests check cross-canvas namespace and revision isolation and read-token write restrictions.

Production access from the agent remains subject to the existing Cloudflare block. This feature does not provide new agent credentials or remove password protection. The existing read-token route supports selecting/listing canvases when network access is available.
