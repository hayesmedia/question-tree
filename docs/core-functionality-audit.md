# Core editor audit and regression fixes

Scope: local Chromium using the latest uploaded project and its corrected export, plus a controlled editor fixture and two separate browser sessions. This is not an inspection of unexported changes on the live Cloudflare site.

## Confirmed issues fixed

- Drag previews used the old right-to-left attachment logic even when released lines used automatic bottom/top or side/top ports. Preview, released canvas and PDF export now share geometry code. Same-group previews retain endpoint choices; green cross-group previews retain group avoidance.
- Green group routing always forced facing side ports. Diagonal moves toward a lower target now support side-to-top attachment. Next-column transitions such as Q099 → Q110 retain their existing facing-side fix rather than doubling back through tall groups.
- Explicit Curve/Straight choices could be overridden by group routing. Those choices are now respected; elbow and curve modes also use placement-aware card ports.
- Canvas and export used inconsistent index-derived lanes and label positions. Both now use the shared helper and explicit saved lane settings.
- Several answers can legitimately share a path. Their label positions are now separated rather than drawn on top of one another. Answer destinations are unchanged.
- Editing an answer connector's diagram label previously changed the answer's display text. It now edits connectionLabel, preserving the actual answer label/value used by the questionnaire.
- G/S/C shortcuts were ignored after a toolbar button received focus. Shortcuts now work from buttons while retaining normal typing inside input fields.
- Manually imported source packages were reconverted while building each card inspector. A weak-reference cache avoids that repeated conversion and naturally refreshes when the package object changes.
- Startup failures previously left a blank page. A bootstrap recovery screen now offers retry, validated JSON recovery import, and a JSON recovery download without clearing the saved project.
- Invalid saved drafts previously fell back to defaults that could then overwrite the draft. Invalid drafts now remain intact and open the recovery screen.
- Drag previews computed the same connector geometry separately for the visible stroke, halo and click target. Each link's preview is computed once per update and reused.

No migrations guessing new business routes, no replacement of current question wording/options, and no production project overwrite are part of these visual and interaction fixes.

## Browser verification

The reusable core suite exercises:

1. Group isolation, card multiselect and bulk fill.
2. Question editing, keyboard answer reorder, undo and redo.
3. Grab/select shortcuts after toolbar clicks.
4. Shift-wheel horizontal pan and stable group entry/exit viewport.
5. Resizing, archive-on-delete and undo recovery.
6. Group color transparency and project JSON download integrity.
7. Connection creation, destination editing, independent diagram labels, arrowheads, summary placement and executable preview navigation.
8. Partial marquee group selection, Shift group multiselect and outside-click deselection.
9. Spacebar panning without card movement and persistent dark mode.
10. JSON import preserving custom title and geometry.
11. Selection edge auto-pan without editing card positions.
12. Startup-failure recovery download without data loss.
13. Moving multiple groups together without moving other cards.
14. Duplicating selected cards, archiving and restoring them.
15. Pointer answer reordering without losing destinations.
16. Preservation of invalid drafts, followed by validated recovery import that backs up the old draft.
17. Cross-group connections, changing both endpoints and navigating from the summary.
18. Saved-project reload integrity.
19. Clicking the rendered connector to open its editor and summary.

Separate browser checks cover the uploaded 147-card project: group double-click entry/exit; stable viewport; dragging without per-movement saves or full redraws; final positions persisted across reload. A two-browser integration with an in-memory revision/CAS API verifies autosave, independent-edit merging, remote updates and viewport preservation. Node tests additionally cover overlapping edit conflicts, offline drafts, server revision rejection, auth/read-token restrictions, visibility and questionnaire routing.

Verification: **110 Node tests pass, 19 core browser scenarios pass**, plus separate large-project drag/group checks and the two-browser collaboration integration. The production build also passes.

## Geometry and performance results

All 215 saved answer/reference connections in the tested project were inspected: zero invalid numeric paths, zero routing fallbacks and zero solid-green crossings through unrelated groups. Five coincident paths represent different answers sharing the same destination; their labels are separated without changing the routing data.

Representative large-project drag check: 10 pointer updates took 80–105 ms total (roughly 8–11 ms each), versus about 5,107 ms before the earlier performance fixes. Three full renders/committed saves across the locate → enter → drag/drop scenario; none during movement. Timing varies by browser and hardware. Final exact rerouting remains a roughly 120–160 ms operation on this fixture.

## Remaining boundaries

- The corrected uploaded project's existing 25 unresolved visibility conditions still require source mappings or missing business questions. Five legacy visual connections still require a routing decision. These are pre-existing content decisions, not silently inferred by the editor audit.
- Live Cloudflare access remains blocked by the previously observed 403/1010 response. Production deployment, production WebSocket delivery and unsupplied browser edits are not independently verified here. The two-browser integration uses a simulated CAS backend, not production credentials.
- Preview strategy selection is still manual; the project does not yet have a complete strategy-selection rule engine. Annualization metadata is not a financial calculator.
- Rotated cards still route against unrotated card bounds; the supplied fixture has no rotated cards. This audit does not claim full Lucidchart feature parity or implement new tools such as nested groups or copy/paste.

## Reproduce

Start `node server.js`, then run the scripts below with Playwright installed outside the repository and a Chromium binary available:

```
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-editor-core.cjs
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-editor-collaboration.cjs
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-group-interactions.cjs /path/to/project.json
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-drag-performance.cjs /path/to/project.json
npm test
npm run build
```
