export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }

  const threshold = Math.pow(10, digits)
  if (Math.abs(value) >= threshold || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) {
    return value.toExponential(2)
  }

  return value.toFixed(digits)
}

export function formatSigned(value: number, digits = 3): string {
  const formatted = formatNumber(Math.abs(value), digits)
  if (formatted === 'n/a') {
    return formatted
  }
  return `${value >= 0 ? '+' : '-'}${formatted}`
}

export function formatAngle(value: number): string {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }
  return `${value.toFixed(2)} deg`
}
