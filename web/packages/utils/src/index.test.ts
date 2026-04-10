import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDateTimeMinute, formatDateTimeSlash } from './index'

describe('@kweaver-web/utils', () => {
  it('formats date time with default pattern', () => {
    expect(formatDateTime('2024-01-02 03:04:05')).toBe('2024-01-02 03:04:05')
  })

  it('formats date time with slash and minute helpers', () => {
    expect(formatDateTimeSlash('2024-01-02 03:04:05')).toBe('2024/01/02 03:04:05')
    expect(formatDateTimeMinute('2024-01-02 03:04:05')).toBe('2024/01/02 03:04')
  })

  it('returns placeholder for empty values', () => {
    expect(formatDateTime(null)).toBe('- -')
    expect(formatDateTimeSlash(undefined)).toBe('- -')
  })
})
