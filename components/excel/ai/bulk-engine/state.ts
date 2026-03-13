import type { CellField } from "../../types"
import type { BulkCellChange } from "./types"

export class BulkChangeState {
  private readonly stagedValues = new Map<string, string | number | null>()
  private readonly changes: BulkCellChange[] = []

  constructor(private readonly getCellValue: (productId: string, field: CellField) => string | number | null) {}

  private getKey(productId: string, field: CellField): string {
    return `${productId}::${field}`
  }

  read(productId: string, field: CellField): string | number | null {
    const key = this.getKey(productId, field)
    return this.stagedValues.has(key) ? (this.stagedValues.get(key) ?? null) : this.getCellValue(productId, field)
  }

  write(productId: string, field: CellField, value: string | number | null): void {
    const key = this.getKey(productId, field)
    this.stagedValues.set(key, value)
    this.changes.push({ productId, field, value })
  }

  getChanges(): BulkCellChange[] {
    return this.changes
  }
}
