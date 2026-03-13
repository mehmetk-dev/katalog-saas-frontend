# Ingest Structure Benchmark

Generated: 2026-03-13T19:50:22.347Z

## Scenario
- Total products: 10000
- Bulk chunk size: 200

## Results
- Single create calls: 10000
- Bulk import calls: 50
- Call reduction: 99.5%
- Reduction factor: 200x fewer requests
- Single loop CPU time: 12.68 ms
- Bulk loop CPU time: 0.35 ms

## Interpretation
- Single flow models 'teker teker urun ekleme' request pattern.
- Bulk flow models Excel/batch import pattern (chunked).
- Network/DB latency is not included in this synthetic test.