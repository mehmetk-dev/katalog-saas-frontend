# Load Regression Report

Generated: 2026-04-28T18:56:51.112Z

## Metrics
- Total products: 2000
- Builder hydration (2000 selected): 88.01 ms
- Builder fetch calls: 4 (expected 4, chunk size 500)
- Excel hook init (2000 rows): 3.18 ms
- Excel apply 500 changes: 12.43 ms
- Excel table first render: 201.53 ms
- Excel table rendered <tr>: 36 (virtualized)

## Notes
- These checks are regression-oriented and run in test environment (jsdom), not production browser timing.
- Thresholds are intentionally generous to detect structural regressions, not micro benchmark noise.