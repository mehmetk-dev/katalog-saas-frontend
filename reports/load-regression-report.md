# Load Regression Report

Generated: 2026-04-25T20:23:16.375Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 67.42 ms
- Builder fetch calls: 4 (expected 4, chunk size 500)
- Excel hook init (2000 rows): 5.15 ms
- Excel apply 500 changes: 15.19 ms
- Excel table first render: 159.89 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.