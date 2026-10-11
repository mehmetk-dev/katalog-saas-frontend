# Load Regression Report

Generated: 2026-10-11T20:32:26.890Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 71.19 ms
- Builder fetch calls: 4 (expected 4, chunk size 500)
- Excel hook init (2000 rows): 4.47 ms
- Excel apply 500 changes: 48.95 ms
- Excel table first render: 173.97 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.