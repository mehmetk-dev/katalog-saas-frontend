import * as XLSX from '@e965/xlsx'

import { HEADER_ALIASES } from './constants'
import { type ColumnMapping } from './types'

type TFunction = (key: string, params?: Record<string, unknown>) => string

export const getImportFileType = (file: File): 'excel' | 'csv' | null => {
    const isExcelFile =
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')

    if (isExcelFile) return 'excel'

    const isCSVFile =
        file.type === 'text/csv' ||
        file.type === 'text/plain' ||
        file.name.endsWith('.csv')

    return isCSVFile ? 'csv' : null
}

export const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    result.push(current.trim())
    return result
}

export const detectDelimiter = (line: string): string => {
    const delimiters = [';', ',', '\t']
    const counts = delimiters.map((delimiter) => ({
        delimiter,
        count: (line.match(new RegExp(delimiter, 'g')) || []).length,
    }))
    return counts.sort((a, b) => b.count - a.count)[0].delimiter
}

export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
    const usedFields = new Set<string>()

    return headers.map((header) => {
        const normalizedHeader = header.toLowerCase().replace(/\*/g, '').trim()
        const matchedField = HEADER_ALIASES[normalizedHeader]

        if (matchedField && !usedFields.has(matchedField)) {
            usedFields.add(matchedField)
            return { csvColumn: header, systemField: matchedField }
        }

        return { csvColumn: header, systemField: null }
    })
}

export const parseExcelFile = (file: File, t: TFunction): Promise<{ headers: string[]; data: string[][] }> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target?.result as string, { type: 'binary', codepage: 1254 })
                const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

                if (jsonData.length < 2) {
                    reject(new Error(t('toasts.noValidData')))
                    return
                }

                const headers = (jsonData[0] as string[]).map((h) => String(h || '').trim())
                const data: string[][] = []

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[]
                    if (row && row.some((v) => v !== undefined && v !== null && String(v).trim() !== '')) {
                        data.push(row.map((v) => (v === undefined || v === null ? '' : String(v).trim())))
                    }
                }

                resolve({ headers, data })
            } catch (error) {
                reject(error)
            }
        }

        reader.onerror = () => reject(new Error(t('toasts.errorOccurred')))
        reader.readAsBinaryString(file)
    })

export const parseCSVFile = (file: File, t: TFunction): Promise<{ headers: string[]; data: string[][] }> =>
    new Promise((resolve, reject) => {
        const readFile = (encoding: string) => {
            const reader = new FileReader()

            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string
                    if (encoding === 'UTF-8' && text.includes('\uFFFD')) {
                        readFile('windows-1254')
                        return
                    }

                    const lines = text.split(/\r?\n/).filter((line) => line.trim())
                    if (lines.length < 2) {
                        reject(new Error(t('toasts.noValidData')))
                        return
                    }

                    const delimiter = detectDelimiter(lines[0])
                    const headers = parseCSVLine(lines[0], delimiter)
                    const data: string[][] = []

                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i], delimiter)
                        const paddedValues = Array(headers.length).fill('')
                        values.forEach((value, idx) => {
                            if (idx < headers.length) paddedValues[idx] = value
                        })
                        if (paddedValues.some(Boolean)) data.push(paddedValues)
                    }

                    resolve({ headers, data })
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = () => reject(new Error(t('toasts.errorOccurred')))
            reader.readAsText(file, encoding)
        }

        readFile('UTF-8')
    })
