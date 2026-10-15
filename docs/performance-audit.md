# Canvas performance audit

Profiled local Chromium with the user's corrected JSONv2 export (147 active cards, 10 groups). This is client-side profiling, not a measurement of production Cloudflare/network latency. Timings vary by machine and browser.

## Confirmed bottlenecks and fixes

1. Every pointer movement during card/group dragging, resizing and bend editing called full render. That rebuilt every card, SVG connector, sidebar and inspector, reran obstacle routing and synchronously serialized/wrote the project. Dragging now updates existing DOM and uses inexpensive connector previews. Exact obstacle-aware routes, full render and committed saving happen on release. Endpoint/arrow metadata and questionnaire data are unchanged.
2. The obstacle router sorted its entire search frontier on every expansion (up to 12,000 expansions per connector). A binary priority queue now chooses the next search state in logarithmic time. Tests verify the same priority and tie ordering as the prior algorithm; existing geometry tests pass.
3. Entering/exiting groups and other non-geometric renders rerouted unchanged connections. A bounded route cache reuses results until card coordinates/sizes or group membership change. Per-link endpoint, routing, bend, color, style and tracing changes invalidate the relevant entry.
4. Unchanged collaboration polling repeatedly compared the full JSON, cloned its baseline and wrote the baseline to local storage. Clean clients now return early when the server revision is unchanged. Dirty-client merging and newer remote revision handling are retained and tested.
5. Selection click redraws were already fixed in the preceding deployment; group entry/exit remains covered by browser checks.

## Measurements

Same scenario: locate Q040, double-click into its group, drag the card in 10 pointer movements, release. Totals below include the locate/group-entry/drop renders; movement-processing totals cover the 10 drag updates.

| Work | Before | After, representative run |
| --- | ---: | ---: |
| Full renders | 13 | 3 |
| Full render time | 6,670 ms | 220 ms |
| Connector routing time | 6,258 ms | 126 ms |
| 10 movement updates | 5,107 ms | 71 ms |
| Slowest movement update | 572 ms | 11 ms |
| Project saves | 13 | 3 |

Across optimized runs movement processing totaled 47–84 ms. There are no full diagram rebuilds or project saves during movement; saving is deferred to release. These figures are processing time, not total wall-clock user interaction duration or a universal speed guarantee.

## Verification

- Browser tests with default and uploaded project: double-click entry, exit, unchanged viewport, no accidental question edits.
- Browser drag check: no full render/save during movement, only dragged card changes, committed coordinates persist across reload, no recentering or page errors.
- Priority queue equivalence and unchanged-revision collaboration regression tests.
- Full Node test suite and production build.

Reproduce against the local server:

```
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-drag-performance.cjs /path/to/project.json
PLAYWRIGHT_MODULE_PATH=/path/to/playwright node scripts/check-group-interactions.cjs /path/to/project.json
```

## Remaining limits

Exact routing and a full DOM rebuild still occur after geometry edits; a representative final reroute took about 120–160 ms. Larger diagrams may need incremental routing or worker-thread computation. Drag previews preserve automatic endpoint choices and green inter-group avoidance; non-green auto previews use a smaller obstacle set, with exact card avoidance on release. See core-functionality-audit.md for the follow-up regression audit. Collaboration retains five-second polling as a fallback to WebSockets and still downloads the current project on those polls. Production network latency, Cloudflare's prior 1010 block, and other editors' live changes cannot be profiled from this local export.
