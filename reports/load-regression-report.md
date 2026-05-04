# Load Regression Report

Generated: 2026-05-04T18:23:51.048Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 99.54 ms
- Builder fetch calls: 4 (expected 4, chunk size 500)
- Excel hook init (2000 rows): 3.13 ms
- Excel apply 500 changes: 13.31 ms
- Excel table first render: 332.71 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.