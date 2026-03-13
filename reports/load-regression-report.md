# Load Regression Report

Generated: 2026-03-13T19:50:10.124Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 93.13 ms
- Builder fetch calls: 10 (expected 10, chunk size 200)
- Excel hook init (2000 rows): 5.17 ms
- Excel apply 500 changes: 1.37 ms
- Excel table first render: 289.57 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.