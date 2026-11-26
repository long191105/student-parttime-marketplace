import type { ChangeEvent } from 'react'

export function normalizeCurrencyAmount(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCurrencyAmount(value: string): string {
  return normalizeCurrencyAmount(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function handleCurrencyInputChange(
  event: ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void,
): void {
  const input = event.currentTarget
  const cursorPosition = input.selectionStart ?? input.value.length
  const digitsBeforeCursor = normalizeCurrencyAmount(input.value.slice(0, cursorPosition)).length
  const nextValue = normalizeCurrencyAmount(input.value)
  onChange(nextValue)
  window.requestAnimationFrame(() => {
    const formattedValue = formatCurrencyAmount(nextValue)
    const nextCursor = findCursorAfterDigits(formattedValue, digitsBeforeCursor)
    input.setSelectionRange(nextCursor, nextCursor)
  })
}

function findCursorAfterDigits(value: string, digitCount: number): number {
  if (digitCount === 0) return 0
  let digitsFound = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) digitsFound += 1
    if (digitsFound === digitCount) return index + 1
  }
  return value.length
}
