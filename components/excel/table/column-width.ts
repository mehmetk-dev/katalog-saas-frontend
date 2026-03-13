import type { SpreadsheetColumn } from "@/components/excel/types"

const WIDTH_RULES: Array<{ token: string; px: number }> = [
  { token: "w-[300px]", px: 300 },
  { token: "w-48", px: 192 },
  { token: "w-40", px: 160 },
  { token: "w-32", px: 128 },
  { token: "w-24", px: 96 },
]

const FALLBACK_WIDTH = 150

export function getColumnInitialWidth(columnWidthClass: string): number {
  for (const rule of WIDTH_RULES) {
    if (columnWidthClass.includes(rule.token)) {
      return rule.px
    }
  }
  return FALLBACK_WIDTH
}

export function getResolvedColumnWidth(
  column: SpreadsheetColumn,
  columnWidths: Record<string, number>,
): number {
  return columnWidths[column.key] || getColumnInitialWidth(column.width)
}
