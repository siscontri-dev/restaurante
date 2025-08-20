export function formatPrice(value: number) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0'
  }
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(',00', '')
} 