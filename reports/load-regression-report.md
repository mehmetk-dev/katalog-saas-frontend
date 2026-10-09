# Load Regression Report

Generated: 2026-10-08T19:41:34.121Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 89.61 ms
- Builder fetch calls: 4 (expected 4, chunk size 500)
- Excel hook init (2000 rows): 3.56 ms
- Excel apply 500 changes: 18.86 ms
- Excel table first render: 190.72 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.